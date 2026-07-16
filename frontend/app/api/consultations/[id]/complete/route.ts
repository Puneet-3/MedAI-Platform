import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { prescription } = await req.json();

    if (!prescription || !prescription.trim()) {
      return NextResponse.json(
        { error: "Prescription content is required to complete session." },
        { status: 400 }
      );
    }

    // Check if the consultation exists, belongs to this doctor, and is ACTIVE
    const consultation = await db.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
    }

    if (consultation.doctorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this room." }, { status: 403 });
    }

    if (consultation.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active consultations can be completed." },
        { status: 400 }
      );
    }

    // Update status to COMPLETED and set prescription
    const updatedConsultation = await db.consultation.update({
      where: { id },
      data: {
        status: "COMPLETED",
        prescription,
      },
    });

    return NextResponse.json({
      success: true,
      consultationId: updatedConsultation.id,
      status: updatedConsultation.status,
      message: "Consultation session completed and prescription issued.",
    });
  } catch (error: any) {
    console.error("Complete consultation error:", error);
    return NextResponse.json(
      { error: "Failed to complete consultation." },
      { status: 500 }
    );
  }
}
