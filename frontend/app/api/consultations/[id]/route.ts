import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = session.user.role;

    // Fetch the consultation
    const consultation = await db.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
    }

    // Verify authorized participant (either the patient or the attending doctor)
    const isPatient = consultation.patientId === userId;
    const isDoctor = consultation.doctorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isPatient && !isDoctor && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access to this room." }, { status: 403 });
    }

    // Fetch patient's latest Prediction records for clinical reference
    const latestPrediction = await db.prediction.findFirst({
      where: { userId: consultation.patientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      consultation,
      latestPrediction,
    });
  } catch (error: any) {
    console.error("Fetch consultation details error:", error);
    return NextResponse.json(
      { error: "Failed to load room details." },
      { status: 500 }
    );
  }
}
