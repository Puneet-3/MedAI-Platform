import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Access denied. Authentication required." },
        { status: 401 }
      );
    }

    // 2. Validate input payload
    const { symptoms } = await req.json();
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. 'symptoms' must be a non-empty array of strings." },
        { status: 400 }
      );
    }

    // 3. Forward request to FastAPI model service
    const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8080";
    const fastapiSecret = process.env.FASTAPI_SECRET || "";

    const response = await fetch(`${fastapiUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FastAPI-Secret": fastapiSecret,
      },
      body: JSON.stringify({ symptoms }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ML Service Error: ${errorText}` },
        { status: response.status }
      );
    }

    const mlData = await response.json(); // Expected format: { results, recommended_test }

    // 4. Save prediction record to database (Supabase via Prisma)
    const savedPrediction = await db.prediction.create({
      data: {
        userId: session.user.id,
        symptoms: symptoms,
        results: mlData.results,
        recommendedTest: mlData.recommended_test || null,
      },
    });

    // 5. Respond back to frontend client
    return NextResponse.json({
      id: savedPrediction.id,
      results: mlData.results,
      recommendedTest: mlData.recommended_test || null,
      createdAt: savedPrediction.createdAt,
    });
  } catch (err: any) {
    console.error("Next.js Proxy Predict Error:", err);
    return NextResponse.json(
      { error: "Internal application error processing prediction request." },
      { status: 500 }
    );
  }
}
