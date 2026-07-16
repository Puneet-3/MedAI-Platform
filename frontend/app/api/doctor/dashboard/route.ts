import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // 1. Fetch WAITING consultations (the patient queue)
    const waiting = await db.consultation.findMany({
      where: {
        status: "WAITING",
        doctorId: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // FIFO order
      },
    });

    // For each waiting patient, fetch their latest prediction
    const queue = await Promise.all(
      waiting.map(async (c) => {
        const latestPrediction = await db.prediction.findFirst({
          where: { userId: c.patientId },
          orderBy: { createdAt: "desc" },
        });
        return {
          ...c,
          latestPrediction,
        };
      })
    );

    // 2. Fetch ACTIVE consultations for this doctor
    const active = await db.consultation.findMany({
      where: {
        doctorId,
        status: "ACTIVE",
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Fetch COMPLETED consultations for history
    const history = await db.consultation.findMany({
      where: {
        doctorId,
        status: "COMPLETED",
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Fetch ANALYZED reports awaiting physician review
    const analyzedReports = await db.report.findMany({
      where: {
        status: "ANALYZED",
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      queue,
      active,
      history,
      analyzedReports: analyzedReports.reverse(), // Show newest first
    });
  } catch (error: any) {
    console.error("Doctor dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
