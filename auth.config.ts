import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import { User } from "./generated/prisma";
import { JWT } from "next-auth/jwt";
import { NextAuthConfig } from "next-auth";

// Extend the session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // authorization: {
      //   params: {
      //     scope: [
      //       'https://www.googleapis.com/auth/userinfo.email',
      //       'https://www.googleapis.com/auth/userinfo.profile',
      //       'https://www.googleapis.com/auth/calendar',
      //       'https://www.googleapis.com/auth/calendar.events',
      //     ].join(' '),
      //     // access_type: 'offline',
      //     // prompt: 'consent',
      //   },
      // },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email && user.id) {
        try {
          // Update user's email settings with Gmail configuration
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailHost: "smtp.gmail.com",
              emailPort: 587,
              emailSecure: false,
              emailUsername: user.email,
              emailPassword: account.access_token as string,
              emailFrom: user.email,
            },
          });
        } catch (error) {
          console.error("Error setting up email configuration:", error);
          // Continue with sign in even if email setup fails
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as User;
        token.id = typedUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};
