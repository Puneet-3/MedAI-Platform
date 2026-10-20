import { db } from "@/lib/db";
import { normalizeEmail, text, validPassword } from "@/lib/validation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validAdminInvitation } from "@/lib/admin-invite";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = text(body?.name, 100);
  const email = normalizeEmail(body?.email);
  const role = body?.role ?? "USER";
  if (!["USER", "DOCTOR", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Choose Patient, Doctor, or Administrator to register." }, { status: 400 });
  }
  if (!name || !email || !validPassword(body?.password)) {
    return NextResponse.json({ error: "Enter your name, a valid email, and a password of at least 8 characters (up to 72 bytes)." }, { status: 400 });
  }
  if (role === "ADMIN" && !validAdminInvitation(body?.invitationCode, email)) {
    return NextResponse.json({ error: "Enter a valid administrator invitation for this email." }, { status: 403 });
  }
  try {
    // Doctor access needs review; administrator access requires a signed invite.
    const user = await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(body.password, 12), role: role === "ADMIN" ? "ADMIN" : "USER", doctorAccessRequested: role === "DOCTOR" },
      select: { id: true },
    });
    return NextResponse.json({ success: true, userId: user.id, doctorAccessRequested: role === "DOCTOR" }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "We couldn't create your account. Please try again shortly." }, { status: 503 });
  }
}
