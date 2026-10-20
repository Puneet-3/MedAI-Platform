import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inference, InferenceError } from "@/lib/inference";
import { NextResponse } from "next/server";
interface PredictionResponse { results: { disease: string; confidence: number }[]; recommended_test: string | null; }
export const maxDuration = 60;
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "USER") return NextResponse.json({ error: "Please sign in as a patient." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.symptoms) || !body.symptoms.length || body.symptoms.length > 132 || body.symptoms.some((s: unknown) => typeof s !== "string" || !s.trim() || s.length > 100)) {
    return NextResponse.json({ error: "Choose between 1 and 132 symptoms from the list." }, { status: 400 });
  }
  const symptoms = [...new Set<string>(body.symptoms)];
  try {
    const result = await inference<PredictionResponse>("/predict", { symptoms });
    const record = await db.prediction.create({ data: { userId: session.user.id, symptoms, results: result.results, recommendedTest: result.recommended_test } });
    return NextResponse.json({ id: record.id, results: result.results, recommendedTest: record.recommendedTest, createdAt: record.createdAt });
  } catch (error) {
    if (error instanceof InferenceError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Saving symptom check failed", error);
    return NextResponse.json({ error: "Your check could not be saved. Please try again shortly." }, { status: 503 });
  }
}
