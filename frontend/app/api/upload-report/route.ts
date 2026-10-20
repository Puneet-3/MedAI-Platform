import { db } from "@/lib/db";
import { auth } from "@/auth";
import { reportExtension, saveReport, removeReport } from "@/lib/report-storage";
import { NextResponse } from "next/server";
import { REPORT_MAX_BYTES, REPORT_MAX_MB } from "@/lib/report-limits";

export const maxDuration = 60;

const types = ["Chest X-Ray", "Complete Blood Count", "Urinalysis Report", "MRI / CT Scan", "Other Medical Report"];
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "USER") return NextResponse.json({ error: "Please sign in as a patient." }, { status: 401 });
  if (Number(req.headers.get("content-length")) > REPORT_MAX_BYTES + 128 * 1024) return NextResponse.json({ error: `Choose a file smaller than ${REPORT_MAX_MB} MB.` }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    const reportType = form.get("reportType");
    if (!(file instanceof File) || !file.size || file.size > REPORT_MAX_BYTES || typeof reportType !== "string" || !types.includes(reportType)) {
      return NextResponse.json({ error: `Choose a report type and a JPG, PNG, or PDF file smaller than ${REPORT_MAX_MB} MB.` }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = reportExtension(bytes);
    if (!extension || (reportType === "Chest X-Ray" && extension === "pdf")) {
      return NextResponse.json({ error: reportType === "Chest X-Ray" ? "Upload chest X-rays as JPG or PNG images." : "Only JPG, PNG, and PDF files are supported." }, { status: 400 });
    }
    const reference = await saveReport(bytes, extension);
    let report;
    try {
      report = await db.report.create({ data: { userId: session.user.id, fileUrl: reference, reportType } });
    } catch (error) {
      await removeReport(reference).catch(() => {});
      throw error;
    }
    let analysisMessage = "Your report has been saved for doctor review.";
    if (reportType === "Chest X-Ray") {
      try {
        const upload = new FormData();
        upload.append("file", new Blob([new Uint8Array(bytes)], { type: file.type }), `xray.${extension}`);
        const response = await fetch(`${process.env.FASTAPI_URL || "http://localhost:8080"}/analyze-upload`, {
          method: "POST", headers: { "x-fastapi-secret": process.env.FASTAPI_SECRET || "" },
          body: upload, signal: AbortSignal.timeout(30000),
        });
        if (response.ok) {
          const result = await response.json();
          // A doctor can review a pending report while screening is running.
          // Never overwrite that completed review with a later model response.
          await db.report.updateMany({
            where: { id: report.id, status: "PENDING" },
            data: { status: "ANALYZED", cnnLabel: result.label, cnnConfidence: result.confidence },
          });
          report = await db.report.findUniqueOrThrow({ where: { id: report.id } });
          analysisMessage = report.status === "REVIEWED"
            ? "Your image is saved, and a doctor has already reviewed it."
            : "Your image has been screened. A doctor still needs to review the result.";
        } else analysisMessage = "Your image is saved. Automated screening is unavailable; it can still be reviewed by a doctor.";
      } catch { analysisMessage = "Your image is saved. Automated screening is unavailable; it can still be reviewed by a doctor."; }
    }
    return NextResponse.json({ success: true, reportId: report.id, status: report.status, message: analysisMessage }, { status: 201 });
  } catch (error) {
    console.error("Report upload failed", error);
    return NextResponse.json({ error: "We couldn't save your report. Please try again." }, { status: 503 });
  }
}
