import type { Role, Subscription } from "@/app/generated/prisma";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ] : [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.doctorAccessRequested = user.doctorAccessRequested === true;
        token.subscription = user.subscription;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.doctorAccessRequested = token.doctorAccessRequested === true;
        session.user.subscription = token.subscription as Subscription;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isDoctor = nextUrl.pathname.startsWith("/doctor");
      const isAdmin = nextUrl.pathname.startsWith("/admin");

      // Layouts and API handlers check the current database role. A cached JWT
      // role must not block an account whose doctor request was just approved.
      if (isDashboard || isDoctor || isAdmin) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
