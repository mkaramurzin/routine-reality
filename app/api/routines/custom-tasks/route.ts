import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCustomTaskRoutine } from "@/lib/routines/custom-tasks";
import { type WellnessCategory } from "@/lib/wellnessColors";

const VALID_WELLNESS_CATEGORIES: WellnessCategory[] = [
  "overall_health",
  "brainy", 
  "body",
  "money",
  "personal_growth",
  "body_maintenance",
  "custom"
];

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, duration, category, description } = body;

    // Validate required fields
    if (!title || !duration || !category || !description) {
      return NextResponse.json(
        { error: "All fields are required: title, duration, category, description" },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (duration.length > 50) {
      return NextResponse.json(
        { error: "Duration must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: "Description must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Validate wellness category
    if (!VALID_WELLNESS_CATEGORIES.includes(category as WellnessCategory)) {
      return NextResponse.json(
        { error: `Invalid wellness category. Must be one of: ${VALID_WELLNESS_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the custom task routine
    const result = await createCustomTaskRoutine(clerkUserId, {
      title: title.trim(),
      duration: duration.trim(),
      category: category as WellnessCategory,
      description: description.trim(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating custom task:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create custom task" },
      { status: 500 }
    );
  }
}
