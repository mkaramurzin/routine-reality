import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/queries/getCurrentUser";
import { updateUserTimezone, updateUserProfile } from "@/lib/queries/updateUser";

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
  
  // Handle legacy timezone-only updates
  if (Object.keys(body).length === 1 && body.timezone) {
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

  // Handle comprehensive profile updates
  const { fullName, timezone, language, profilePictureUrl, productivityGoal, onboarded } = body;
  
  const profileData: any = {};
  if (fullName !== undefined) profileData.fullName = fullName;
  if (timezone !== undefined) profileData.timezone = timezone;
  if (language !== undefined) profileData.language = language;
  if (profilePictureUrl !== undefined) profileData.profilePictureUrl = profilePictureUrl;
  if (productivityGoal !== undefined) profileData.productivityGoal = productivityGoal;
  if (onboarded !== undefined) profileData.onboarded = onboarded;

  if (Object.keys(profileData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided for update." },
      { status: 400 }
    );
  }

  const updatedUser = await updateUserProfile(clerkUserId, profileData);

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(updatedUser);
}
