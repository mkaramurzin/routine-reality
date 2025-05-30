import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createRoutine } from "@/lib/queries/createRoutine";
import { getUserRoutines } from "@/lib/queries/getUserRoutines";

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routines = await getUserRoutines(clerkUserId);

  return NextResponse.json(routines);
}

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, routineInfo, routineType, startDate, endDate, stages, thresholds } = body;

  // Basic validation
  if (
    !title ||
    !routineInfo ||
    !routineType ||
    !startDate ||
    !endDate ||
    !stages ||
    !Array.isArray(thresholds)
  ) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  try {
    const routine = await createRoutine(clerkUserId, {
      title,
      routineInfo,
      routineType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      stages,
      thresholds,
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
