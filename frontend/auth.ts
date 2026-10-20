import type { Role, Subscription } from "@/app/generated/prisma";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!email || typeof credentials?.password !== "string") return null;
        if (typeof credentials.role !== "string" || !["USER", "DOCTOR", "ADMIN"].includes(credentials.role)) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) return null;
        // Pending doctor applicants select Doctor, but keep restricted access.
        const loginRole = user.role === "USER" && user.doctorAccessRequested ? "DOCTOR" : user.role;
        if (credentials.role !== loginRole) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          doctorAccessRequested: user.doctorAccessRequested,
          subscription: user.subscription,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = normalizeEmail(user.email);
        if (!email || profile?.email_verified !== true) return false;
        user.email = email;
        await db.user.upsert({
          where: { email },
          update: {},
          create: { email, name: user.name || "", role: "USER", subscription: "FREE" },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = normalizeEmail(user?.email || token.email);
      if (!email) return null;
      if (email) {
        const dbUser = await db.user.findUnique({
          where: { email },
          select: { id: true, name: true, role: true, subscription: true, doctorAccessRequested: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.doctorAccessRequested = dbUser.doctorAccessRequested;
          token.subscription = dbUser.subscription;
        } else {
          return null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.doctorAccessRequested = token.doctorAccessRequested === true;
        session.user.subscription = token.subscription as Subscription;
      }
      return session;
    },
  },
});
