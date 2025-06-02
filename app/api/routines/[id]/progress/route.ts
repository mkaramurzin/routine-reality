import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getRoutineProgress } from "@/lib/queries/getRoutineProgress";

// Helper to extract route param
function getIdFromUrl(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/");
  const routinesIndex = segments.indexOf("routines");
  const routineId = routinesIndex !== -1 ? segments[routinesIndex + 1] : null;
  return routineId || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  try {
    const progress = await getRoutineProgress(clerkUserId, id);

    if (!progress) {
      return NextResponse.json({ error: "Routine not found." }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 