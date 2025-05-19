import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getTaskSetsForRoutine } from "@/lib/queries/getTaskSetsForRoutine";
import { createTaskSet } from "@/lib/queries/createTaskSet";

// Extracts routine ID from path: /api/routines/[id]/task-sets
function getRoutineIdFromUrl(request: NextRequest): string | null {
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

  const routineId = getRoutineIdFromUrl(request);
  if (!routineId) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  try {
    const taskSets = await getTaskSetsForRoutine(clerkUserId, routineId);
    return NextResponse.json(taskSets);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status:
          (error as Error).message === "Routine not found" ? 404 : 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routineId = getRoutineIdFromUrl(request);
  if (!routineId) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  const body = await request.json();
  const { stageNumber, title, description } = body;

  if (
    typeof stageNumber !== "number" ||
    !title ||
    typeof title !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  try {
    const taskSet = await createTaskSet(clerkUserId, routineId, {
      stageNumber,
      title,
      description,
    });

    return NextResponse.json(taskSet, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status:
          (error as Error).message === "Routine not found" ? 404 : 500,
      }
    );
  }
}