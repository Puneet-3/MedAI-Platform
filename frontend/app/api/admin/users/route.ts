import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  try {
    const users = await db.user.findMany({ select: { id: true, name: true, email: true, role: true, doctorAccessRequested: true, subscription: true, createdAt: true }, orderBy: [{ doctorAccessRequested: "desc" }, { createdAt: "desc" }] });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Loading users failed", error);
    return NextResponse.json({ error: "We couldn't load the account list." }, { status: 503 });
  }
}
export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.userId !== "string" || !["USER", "DOCTOR"].includes(body?.role)) return NextResponse.json({ error: "Choose a patient or doctor role." }, { status: 400 });
  if (body.userId === session.user.id) return NextResponse.json({ error: "You cannot change your own access here." }, { status: 400 });
  try {
    const updated = await db.user.updateMany({ where: { id: body.userId, role: { not: "ADMIN" } }, data: { role: body.role, doctorAccessRequested: false } });
    if (!updated.count) return NextResponse.json({ error: "Account not found or protected administrator account." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Changing account access failed", error);
    return NextResponse.json({ error: "We couldn't update this account." }, { status: 503 });
  }
}
