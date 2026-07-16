import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await db.report.findMany({
      where: { userId: session.user.id },
    });

    // Invert to show newest first (since we don't have a createdAt timestamp)
    return NextResponse.json({ success: true, reports: reports.reverse() });
  } catch (error: any) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
