import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logAuthData } from "@/logs/featurs";
import { acquireAdminLock, recordLoginHistory } from "@/lib/admin-session";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.Client_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || "dummy-client-secret",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read"
        }
      },
      async profile(profile, tokens) {
        let phone = null;
        let address = null;

        if (tokens.access_token) {
          try {
            const res = await fetch(
              "https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,addresses",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              }
            );
            if (res.ok) {
              const peopleData = await res.json();
              phone = peopleData.phoneNumbers?.[0]?.value || null;
              address = peopleData.addresses?.[0]?.formatted || null;
            }
          } catch (err) {
            console.error("Error fetching extra profile data from Google People API:", err);
          }
        }

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          phone,
          address,
        };
      }
    }),
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
          }
        } catch (e) {
          // Ignore lookup failures in edge environments
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "user";
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

      let shouldBeAdmin = false;
      if (email) {
        shouldBeAdmin = adminEmails.includes(email.toLowerCase());
      }

      try {
        if (!shouldBeAdmin) {
          // Check if this is the first user in the database
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            shouldBeAdmin = true;
          }
        }

        if (dbUser) {
          if (shouldBeAdmin && dbUser.role !== "admin") {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "admin" },
            });
            (user as any).role = "admin";
          } else {
            (user as any).role = dbUser.role;
          }
        } else if (shouldBeAdmin) {
          // New user will be saved with role 'admin'
          (user as any).role = "admin";
        }

        // Verify active session lock for any admin login
        const isUserAdmin = (user as any).role === "admin" || dbUser?.role === "admin" || shouldBeAdmin;
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
  },
  pages: {
    signIn: "/login",
  },
};
