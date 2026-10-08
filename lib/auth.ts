import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logAuthData } from "@/logs/featurs";
import { acquireAdminLock, recordLoginHistory } from "@/lib/admin-session";
import { MAX_PASSWORD_LENGTH } from "@/lib/validations/auth";

export function getGoogleProvider(
  clientId = process.env.GOOGLE_CLIENT_ID?.trim(),
  clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim(),
  nodeEnv = process.env.NODE_ENV
) {
  if (!clientId || !clientSecret) {
    if (nodeEnv === "development") {
      console.warn(
        "[NextAuth] Missing GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET. Google OAuth provider is disabled."
      );
    }
    return null;
  }

  return GoogleProvider({
    clientId,
    clientSecret,
    authorization: {
      params: {
        scope: "openid email profile",
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
  });
}

const googleProvider = getGoogleProvider();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        deviceName: { label: "Device Name", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        if (typeof credentials.password !== "string" || credentials.password.length > MAX_PASSWORD_LENGTH) {
          throw new Error("InvalidCredentials");
        }

        const phoneNormalized = credentials.phone.trim();
        const forwarded = req?.headers?.['x-forwarded-for'];
        let clientIp = '127.0.0.1';
        if (forwarded) {
          clientIp = String(forwarded).split(',')[0].trim();
        } else if (req?.headers?.['x-real-ip']) {
          clientIp = String(req.headers['x-real-ip']).trim();
        }

        // Apply rate limit on phone/password login attempts: max 5 attempts per 15-minute window per IP/phone
        const identifier = `auth:login:${phoneNormalized}:${clientIp}`;
        const rateLimitResult = await checkRateLimit(identifier, {
          keyPrefix: 'login',
          limit: 5,
          windowSeconds: 900, // 15 minutes
        });

        if (!rateLimitResult.success) {
          throw new Error("TooManyRequests");
        }

        const user = await prisma.user.findFirst({
          where: { phone: phoneNormalized }
        });

        if (!user || !user.password) {
          throw new Error("InvalidCredentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("InvalidCredentials");
        }

        const deviceName =
          (credentials as any)?.deviceName ||
          (req?.headers as any)?.['x-device-name'] ||
          (req?.headers as any)?.['x-device-model'] ||
          (req?.headers as any)?.['sec-ch-ua-model'] ||
          null;

        // If user is admin, verify active session lock & single-device per account
        if (user.role === "admin") {
          const deviceId = (credentials as any)?.deviceId || (req?.headers as any)?.['x-device-id'] || 'default_device';
          const userAgent = (req?.headers as any)?.['user-agent'] || null;

          const lockResult = await acquireAdminLock(user.id, {
            deviceId,
            deviceName,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            userAgent,
            headers: req?.headers as any,
          });

          if (!lockResult.success) {
            if (lockResult.error === 'SameAccountAnotherDevice') {
              throw new Error("SameAccountAnotherDevice");
            }
            throw new Error("AdminSessionActive");
          }
        }

        const userAgent = (req?.headers as any)?.['user-agent'] || null;
        await recordLoginHistory({
          userId: user.id,
          userName: user.name,
          userPhone: user.phone,
          userEmail: user.email,
          role: user.role,
          userAgent,
          deviceName,
          headers: req?.headers as any,
          status: 'success',
        });

        return user;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
        token.phone = (user as any).phone || null;
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, phone: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.phone = dbUser.phone;
          } else {
            // User was deleted from database: invalidate token and revoke privileges
            delete (token as any).id;
            delete (token as any).role;
            delete (token as any).phone;
            delete (token as any).email;
            delete (token as any).name;
            delete (token as any).picture;
            delete (token as any).sub;
            return {};
          }
        } catch (e) {
          // If token has been cleared or deleted, return empty
          if (!token?.id || !token?.role) {
            return {};
          }
          // Ignore lookup failures in edge environments
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !token?.role) {
        return {
          ...session,
          user: undefined as any,
          expires: new Date(0).toISOString(),
        };
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = (token.phone as string) || null;
      }
      return session;
    },
    async signIn({ user, account }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (account?.provider === "credentials") {
        if (!dbUser?.emailVerified) {
          throw new Error("EmailNotVerified");
        }
      }

      if (account?.provider === "google" && user.email) {
        if (!dbUser) {
          logAuthData({ user, account });
        }
      }

      const email = user.email || dbUser?.email;
      const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
      const adminEmails = adminEmailsEnv
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      try {
        if (dbUser) {
          // Existing user: preserve their existing role in the database.
          // Do NOT silently elevate existing users to admin on every sign-in.
          (user as any).role = dbUser.role;
        } else {
          // First-time signup / bootstrap: check if user qualifies for initial admin role
          let shouldBeAdmin = false;
          if (email) {
            shouldBeAdmin = adminEmails.includes(email.toLowerCase());
          }
          if (!shouldBeAdmin) {
            // Check if this is the first user in the database
            const userCount = await prisma.user.count();
            if (userCount === 0) {
              shouldBeAdmin = true;
            }
          }

          if (shouldBeAdmin) {
            (user as any).role = "admin";
          } else {
            (user as any).role = "user";
          }
        }

        // Verify active session lock for any admin login
        const isUserAdmin = (user as any).role === "admin";
        if (isUserAdmin) {
          const lockResult = await acquireAdminLock(user.id, {
            userName: user.name,
            userEmail: email,
            userPhone: (user as any).phone || dbUser?.phone,
          });

          if (!lockResult.success) {
            if (lockResult.error === 'SameAccountAnotherDevice') {
              throw new Error("SameAccountAnotherDevice");
            }
            throw new Error("AdminSessionActive");
          }
        }
      } catch (err: any) {
        if (err?.message === "AdminSessionActive" || err?.message === "SameAccountAnotherDevice") {
          throw err;
        }
        console.error("Error in signIn callback:", err);
      }

      if (account?.provider !== "credentials") {
        await recordLoginHistory({
          userId: user.id,
          userName: user.name,
          userPhone: (user as any).phone || dbUser?.phone,
          userEmail: email,
          role: (user as any).role || dbUser?.role || "user",
          status: "success",
        });
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      const canonicalBase = (process.env.NEXTAUTH_URL || baseUrl || "https://candyeco-production.up.railway.app").replace(/\/$/, "");
      if (url.startsWith("/")) {
        return `${canonicalBase}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === new URL(canonicalBase).origin) {
          return url;
        }
      } catch {}
      return `${canonicalBase}/home`;
    },
  },
  pages: {
    signIn: "/login",
  },
};
