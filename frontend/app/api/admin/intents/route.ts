import { auth } from "@/auth";
import { inference, InferenceError } from "@/lib/inference";
import { NextResponse } from "next/server";
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  try {
    const data = await inference<{ intents: unknown[] }>("/intents");
    return NextResponse.json({ success: true, intents: data.intents });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Couldn't load responses." }, { status: error instanceof InferenceError ? error.status : 503 });
  }
}
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  const payload = await req.json().catch(() => null);
  if (!Array.isArray(payload?.intents) || !payload.intents.length) return NextResponse.json({ error: "Keep at least one topic." }, { status: 400 });
  try {
    const data = await inference<{ message: string }>("/intents", payload);
    return NextResponse.json({ success: true, message: data.message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Couldn't save responses." }, { status: error instanceof InferenceError ? error.status : 503 });
  }
}
