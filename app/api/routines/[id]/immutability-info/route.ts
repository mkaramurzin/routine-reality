import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getTaskImmutabilityInfo } from "@/lib/routines/taskImmutability";

// Helper to extract route param
function getIdFromUrl(request: NextRequest): string | null {
  const url = request.nextUrl.pathname;
  const segments = url.split('/');
  const idIndex = segments.findIndex(segment => segment === 'routines') + 1;
  return segments[idIndex] || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routineId = getIdFromUrl(request);
  if (!routineId) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  // Get newStage from query params
  const { searchParams } = new URL(request.url);
  const newStageParam = searchParams.get('newStage');
  
  if (!newStageParam) {
    return NextResponse.json({ error: "Missing newStage parameter" }, { status: 400 });
  }

  const newStage = parseInt(newStageParam, 10);
  if (isNaN(newStage)) {
    return NextResponse.json({ error: "Invalid newStage parameter" }, { status: 400 });
  }

  try {
    const immutabilityInfo = await getTaskImmutabilityInfo(routineId, newStage);
    return NextResponse.json(immutabilityInfo);
  } catch (error) {
    console.error("Error getting immutability info:", error);
    return NextResponse.json(
      { error: "Failed to get immutability info" },
      { status: 500 }
    );
  }
} 