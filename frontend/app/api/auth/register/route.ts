import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user in the database
    const user = await db.user.create({
      data: {
        name: name || "",
        email,
        passwordHash,
        role: role === "DOCTOR" ? "DOCTOR" : "USER",
        subscription: "FREE",
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "User registered successfully.",
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json(
      { error: "Failed to register user due to an internal error." },
      { status: 500 }
    );
  }
}
