import { auth } from "@/auth";
import { db } from "@/lib/db";
import { text } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const content = text(body?.content, 4000);
  const messageId = body?.clientMessageId;
  if (!content || typeof messageId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId)) {
    return NextResponse.json({ error: "Enter a message of up to 4,000 characters." }, { status: 400 });
  }
  try {
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM consultations WHERE id = ${id} FOR UPDATE`;
      const room = await tx.consultation.findUnique({ where: { id } });
      if (!room || ![room.patientId, room.doctorId].includes(session.user.id)) return { status: 403, error: "You cannot send messages to this consultation." };
      const existing = await tx.message.findUnique({ where: { id: messageId }, include: { sender: { select: { id: true, name: true, role: true } } } });
      if (existing) {
        if (existing.consultationId !== id || existing.senderId !== session.user.id || existing.content !== content) return { status: 409, error: "Please send this as a new message." };
        return { message: existing };
      }
      if (room.status !== "ACTIVE") return { status: 409, error: "This consultation is closed. Your message was not sent." };
      const recent = await tx.message.count({ where: { consultationId: id, senderId: session.user.id, createdAt: { gte: new Date(Date.now() - 60000) } } });
      if (recent >= 60) return { status: 429, error: "Please wait a moment before sending more messages." };
      const message = await tx.message.create({
        data: { id: messageId, consultationId: id, senderId: session.user.id, content },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });
      return { message };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: result.message }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("Consultation message could not be saved.");
    return NextResponse.json({ error: "Your message could not be saved. Please try again." }, { status: 503 });
  }
}
