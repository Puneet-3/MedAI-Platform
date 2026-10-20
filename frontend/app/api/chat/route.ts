import { auth } from "@/auth";
import { text } from "@/lib/validation";
import { inference, InferenceError } from "@/lib/inference";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const message = text(body?.message, 2000);
  if (!message) return NextResponse.json({ error: "Enter a message of up to 2,000 characters." }, { status: 400 });
  try {
    return NextResponse.json(await inference("/chat", { message }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The assistant is unavailable." }, { status: error instanceof InferenceError ? error.status : 503 });
  }
}
