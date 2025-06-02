import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { fullName, timezone = "UTC", language = "English", profilePictureUrl, productivityGoal } = body;

    await db.insert(users).values({
      clerkUserId: userId,
      fullName,
      timezone,
      language,
      profilePictureUrl,
      productivityGoal,
      onboarded: !!fullName, // Mark as onboarded if basic info provided
    });

    return NextResponse.json({ created: true });
  } catch (err) {
    console.error("❌ Failed to onboard user", err);
    return new NextResponse("Server error", { status: 500 });
  }
}