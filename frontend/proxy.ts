import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Optimistic navigation checks; layouts and API handlers verify the live database role.
const { auth } = NextAuth(authConfig);
export const proxy = auth(request => {
  if (request.nextUrl.pathname.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Open this report from your authenticated reports page." }, { status: 403 });
  }
  if (!request.auth?.user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});
export const config = { matcher: ["/dashboard/:path*", "/doctor/:path*", "/doctor-registration", "/admin/:path*", "/uploads/:path*", "/account"] };
