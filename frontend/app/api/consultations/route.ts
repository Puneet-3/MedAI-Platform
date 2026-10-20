import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = session.user.id;

    // Fetch active or waiting consultation
    const current = await db.consultation.findFirst({
      where: {
        patientId,
        status: { in: ["WAITING", "ACTIVE"] },
      },
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch completed consultations for history
    const history = await db.consultation.findMany({
      where: {
        patientId,
        status: "COMPLETED",
      },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      current,
      history,
    });
  } catch (error: unknown) {
    console.error("Fetch consultations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultations." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = session.user.id;

    const consultation = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${patientId} FOR UPDATE`;
      const existing = await tx.consultation.findFirst({ where: { patientId, status: { in: ["WAITING", "ACTIVE"] } } });
      return existing || tx.consultation.create({ data: { patientId, status: "WAITING" } });
    });
    return NextResponse.json({ success: true, consultationId: consultation.id, status: consultation.status });

  } catch (error: unknown) {
    console.error("Create consultation error:", error);
    return NextResponse.json(
      { error: "Failed to request consultation." },
      { status: 500 }
    );
  }
}
