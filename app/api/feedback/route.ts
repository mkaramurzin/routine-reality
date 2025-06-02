import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, email } = body;

    // Basic validation
    if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Feedback is required" },
        { status: 400 }
      );
    }

    if (email && typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Log feedback to console (in production, you'd want to save to database)
    console.log("🔔 New Feedback Received:");
    console.log("Feedback:", feedback.trim());
    console.log("Email:", email?.trim() || "Not provided");
    console.log("Timestamp:", new Date().toISOString());
    console.log("---");

    // TODO: In production, save to database
    // Example:
    // await db.insert(feedbackTable).values({
    //   feedback: feedback.trim(),
    //   email: email?.trim() || null,
    //   createdAt: new Date(),
    // });

    // Basic rate limiting could be implemented here
    // For now, we'll just return success

    return NextResponse.json(
      {
        success: true,
        message: "Feedback received successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 