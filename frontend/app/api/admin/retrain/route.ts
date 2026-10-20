import { auth } from "@/auth";
import { inference, InferenceError } from "@/lib/inference";
import { NextResponse } from "next/server";
export const maxDuration = 300;
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  try {
    const data = await inference<{ message: string }>("/retrain", {}, 240000);
    return NextResponse.json({ success: true, message: data.message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retraining failed." }, { status: error instanceof InferenceError ? error.status : 503 });
  }
}
