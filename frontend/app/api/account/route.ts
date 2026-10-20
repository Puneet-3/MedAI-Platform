import { auth } from "@/auth";
import { db } from "@/lib/db";
import { text, validPassword } from "@/lib/validation";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = text(body?.name, 100);
  if (!name) return NextResponse.json({ error: "Enter a name between 1 and 100 characters." }, { status: 400 });
  try {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    let passwordHash: string | undefined;
    if (body.newPassword) {
      if (!validPassword(body.newPassword)) return NextResponse.json({ error: "Use at least 8 characters, up to 72 bytes, for your new password." }, { status: 400 });
      if (!user.passwordHash || typeof body.currentPassword !== "string" || !await bcrypt.compare(body.currentPassword, user.passwordHash)) {
        return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(body.newPassword, 12);
    }
    await db.user.update({ where: { id: user.id }, data: { name, ...(passwordHash ? { passwordHash } : {}) } });
    return NextResponse.json({ success: true, message: passwordHash ? "Your name and password have been updated." : "Your name has been updated." });
  } catch (error) {
    console.error("Account update failed", error);
    return NextResponse.json({ error: "We couldn't save your changes. Please try again." }, { status: 503 });
  }
}
