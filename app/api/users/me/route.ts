import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/queries/getCurrentUser";
import { updateUserTimezone } from "@/lib/queries/updateUser";

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getCurrentUser(clerkUserId);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { timezone } = body;

  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json(
      { error: "Invalid timezone provided." },
      { status: 400 }
    );
  }

  const updatedUser = await updateUserTimezone(clerkUserId, timezone);

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(updatedUser);
}
