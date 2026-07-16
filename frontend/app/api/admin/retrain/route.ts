import { auth } from "@/auth";
import { NextResponse } from "next/server";

const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8080";
const secret = process.env.FASTAPI_SECRET || "";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${fastapiUrl}/retrain`, {
      method: "POST",
      headers: {
        "x-fastapi-secret": secret,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to trigger retrain on FastAPI.");

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    console.error("Admin proxy retrain error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrain model." }, { status: 500 });
  }
}
