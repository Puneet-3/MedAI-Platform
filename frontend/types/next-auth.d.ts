import { Role, Subscription } from "@/app/generated/prisma";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    subscription: Subscription;
    doctorAccessRequested?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      subscription: Subscription;
      doctorAccessRequested: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    subscription: Subscription;
    doctorAccessRequested?: boolean;
  }
}
