import { auth } from "@/auth";
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
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Invalid payload. 'message' must be a non-empty string." },
        { status: 400 }
      );
    }

    // 3. Forward request to FastAPI chatbot service
    const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8080";
    const fastapiSecret = process.env.FASTAPI_SECRET || "";

    const response = await fetch(`${fastapiUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FastAPI-Secret": fastapiSecret,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ML Service Error: ${errorText}` },
        { status: response.status }
      );
    }

    const mlData = await response.json(); // Expected format: { intent, response, confidence }

    // 4. Respond back to frontend client
    return NextResponse.json({
      intent: mlData.intent,
      response: mlData.response,
      confidence: mlData.confidence,
    });
  } catch (err: any) {
    console.error("Next.js Proxy Chat Error:", err);
    let errorMsg = "Internal application error processing chat request.";
    
    // Check if the error is due to FastAPI being offline
    if (
      err.code === "ECONNREFUSED" || 
      err.message?.includes("fetch failed") || 
      err.message?.includes("connect ECONNREFUSED")
    ) {
      errorMsg = "The AI Health Assistant is temporarily offline or undergoing maintenance. Please try again in a few moments, or check your symptom checker.";
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 503 }
    );
  }
}
