import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
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
  } catch (error: any) {
    console.error("Fetch consultations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = session.user.id;

    // Check if there is already an active or waiting consultation for this patient
    const existingConsultation = await db.consultation.findFirst({
      where: {
        patientId,
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });

    if (existingConsultation) {
      return NextResponse.json({
        success: true,
        consultationId: existingConsultation.id,
        status: existingConsultation.status,
        message: "You already have a consultation in progress.",
      });
    }

    // Create a new consultation request (doctorId is optional and null initially)
    const newConsultation = await db.consultation.create({
      data: {
        patientId,
        status: "WAITING",
      },
    });

    return NextResponse.json({
      success: true,
      consultationId: newConsultation.id,
      status: newConsultation.status,
      message: "Consultation requested successfully.",
    });
  } catch (error: any) {
    console.error("Create consultation error:", error);
    return NextResponse.json(
      { error: "Failed to request consultation." },
      { status: 500 }
    );
  }
}
