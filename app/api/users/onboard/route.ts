import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { onboardingSchema } from "@/schemas/onboardingSchema";

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ user: null, onboarded: false });
    }

    return NextResponse.json({ 
      user: user[0], 
      onboarded: user[0].onboarded 
    });
  } catch (err) {
    console.error("❌ Failed to check user onboarding status", err);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        message: "User already onboarded", 
        user: existingUser[0] 
      });
    }

    const body = await request.json();
    
    // Validate the data using the onboarding schema
    const validationResult = onboardingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid data", 
          details: validationResult.error.errors 
        }), 
        { status: 400 }
      );
    }

    const { 
      fullName, 
      timezone, 
      language, 
      profilePictureUrl, 
      productivityGoal 
    } = validationResult.data;

    // Create user record
    const newUser = await db.insert(users).values({
      clerkUserId: userId,
      fullName,
      timezone,
      language,
      profilePictureUrl: profilePictureUrl || null,
      productivityGoal: productivityGoal || null,
      onboarded: true, // Mark as fully onboarded
    }).returning();

    return NextResponse.json({ 
      created: true, 
      user: newUser[0] 
    });
  } catch (err) {
    console.error("❌ Failed to onboard user", err);
    return new NextResponse("Server error", { status: 500 });
  }
}