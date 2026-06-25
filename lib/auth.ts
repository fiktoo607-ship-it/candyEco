import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.Client_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || "dummy-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user || !user.password) {
          throw new Error("InvalidCredentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("InvalidCredentials");
        }

        return user;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
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
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });
        if (!dbUser?.emailVerified) {
          throw new Error("EmailNotVerified");
        }
      }

      if (!user.email) return false;

      const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
      const adminEmails = adminEmailsEnv
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      let shouldBeAdmin = adminEmails.includes(user.email.toLowerCase());

      try {
        if (!shouldBeAdmin) {
          // Check if this is the first user in the database
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            shouldBeAdmin = true;
          }
        }

        // If the user already exists in the database, update their role if needed
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          if (shouldBeAdmin && dbUser.role !== "admin") {
            await prisma.user.update({
              where: { email: user.email },
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
      } catch (err) {
        console.error("Error in signIn callback:", err);
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};
