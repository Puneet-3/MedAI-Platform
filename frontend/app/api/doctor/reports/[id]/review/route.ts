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
    const { doctorNotes } = await req.json();

    if (!doctorNotes || !doctorNotes.trim()) {
      return NextResponse.json({ error: "Doctor notes are required." }, { status: 400 });
    }

    // Verify report exists and is not already reviewed (or can be re-reviewed)
    const report = await db.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Medical report not found." }, { status: 404 });
    }

    // Update status to REVIEWED, save doctorNotes and doctorId
    const updatedReport = await db.report.update({
      where: { id },
      data: {
        status: "REVIEWED",
        doctorNotes: doctorNotes.trim(),
        doctorId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: updatedReport.id,
      status: updatedReport.status,
      message: "Report clinically reviewed successfully.",
    });
  } catch (error: any) {
    console.error("Clinical report review error:", error);
    return NextResponse.json({ error: "Failed to submit clinical review notes." }, { status: 500 });
  }
}
