import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscription: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Admin list users error:", error);
    return NextResponse.json({ error: "Failed to fetch user list." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role, subscription } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Validate inputs
    const dataToUpdate: any = {};
    if (role) {
      if (role !== "USER" && role !== "DOCTOR" && role !== "ADMIN") {
        return NextResponse.json({ error: "Invalid role value." }, { status: 450 });
      }
      dataToUpdate.role = role;
    }

    if (subscription) {
      if (subscription !== "FREE" && subscription !== "PREMIUM") {
        return NextResponse.json({ error: "Invalid subscription value." }, { status: 450 });
      }
      dataToUpdate.subscription = subscription;
    }

    // Update user in DB
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscription: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User properties updated successfully.",
    });
  } catch (error: any) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
