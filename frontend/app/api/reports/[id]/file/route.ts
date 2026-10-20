import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readReport, reportDownloadUrl } from "@/lib/report-storage";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const { id } = await params;
    const report = await db.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    const user = session.user;
    if (report.userId !== user.id && user.role !== "ADMIN" && user.role !== "DOCTOR") return NextResponse.json({ error: "You can't access this report." }, { status: 403 });
    if (process.env.VERCEL) {
      const url = await reportDownloadUrl(report.fileUrl);
      if (url) return new Response(null, { status: 307, headers: { Location: url, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
    }
    const file = await readReport(report.fileUrl);
    return new Response(file.bytes, { headers: {
      "Content-Type": file.type, "Content-Disposition": `inline; filename="report.${file.name.split(".").pop()}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    } });
  } catch (error) {
    console.error("Report download failed", error);
    return NextResponse.json({ error: "This report is unavailable. Please try again or upload it again." }, { status: 503 });
  }
}
