import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createAdminInvitation } from "@/lib/admin-invite";
import { normalizeEmail } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Enter the new administrator's email." }, { status: 400 });
  try {
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) return NextResponse.json({ error: "This email already has an account. Invitations are for new accounts." }, { status: 409 });
    return NextResponse.json({ email, ...createAdminInvitation(email) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We couldn't create the invitation. Please try again." }, { status: 503 });
  }
}
