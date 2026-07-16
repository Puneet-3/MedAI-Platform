import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;

      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isDoctor = nextUrl.pathname.startsWith("/doctor");
      const isAdmin = nextUrl.pathname.startsWith("/admin");

      if (isDashboard || isDoctor || isAdmin) {
        if (!isLoggedIn) return false; // Redirects to login page

        // Redirect DOCTOR/ADMIN from patient dashboard to their respective dashboards
        if (isDashboard) {
          if (userRole === "DOCTOR") {
            return Response.redirect(new URL("/doctor/dashboard", nextUrl));
          }
          if (userRole === "ADMIN") {
            return Response.redirect(new URL("/admin", nextUrl));
          }
          if (userRole !== "USER") {
            return Response.redirect(new URL("/unauthorized", nextUrl));
          }
        }
        
        if (isDoctor && userRole !== "DOCTOR") {
          return Response.redirect(new URL("/unauthorized", nextUrl));
        }
        if (isAdmin && userRole !== "ADMIN") {
          return Response.redirect(new URL("/unauthorized", nextUrl));
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
