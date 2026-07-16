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
    const doctorId = session.user.id;

    // Check if the consultation exists and is WAITING
    const consultation = await db.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
    }

    if (consultation.status !== "WAITING") {
      return NextResponse.json(
        { error: "This consultation has already been accepted or completed." },
        { status: 400 }
      );
    }

    // Update status to ACTIVE and set doctorId
    const updatedConsultation = await db.consultation.update({
      where: { id },
      data: {
        doctorId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      consultationId: updatedConsultation.id,
      status: updatedConsultation.status,
      message: "Patient accepted successfully.",
    });
  } catch (error: any) {
    console.error("Accept consultation error:", error);
    return NextResponse.json(
      { error: "Failed to accept patient." },
      { status: 500 }
    );
  }
}
