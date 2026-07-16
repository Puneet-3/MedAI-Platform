import { auth } from "@/auth";
import { NextResponse } from "next/server";

const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8080";
const secret = process.env.FASTAPI_SECRET || "";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${fastapiUrl}/intents`, {
      method: "GET",
      headers: {
        "x-fastapi-secret": secret,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to load intents from FastAPI.");

    return NextResponse.json({ success: true, intents: data.intents || [] });
  } catch (error: any) {
    console.error("Admin proxy get intents error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve intents." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    const response = await fetch(`${fastapiUrl}/intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fastapi-secret": secret,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to save intents on FastAPI.");

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    console.error("Admin proxy save intents error:", error);
    return NextResponse.json({ error: error.message || "Failed to save intents." }, { status: 500 });
  }
}
