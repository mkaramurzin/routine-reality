import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTaskSetsForRoutine } from "@/lib/queries/getTaskSetsForRoutine";
import { createTaskSet } from "@/lib/queries/createTaskSet";

export async function GET(
  req: Request,
  { params }: { params: { routineId: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const taskSets = await getTaskSetsForRoutine(clerkUserId, params.routineId);
    return NextResponse.json(taskSets);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: (error as Error).message === "Routine not found" ? 404 : 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { routineId: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { stageNumber, title, description } = body;

  // Simple validation
  if (
    typeof stageNumber !== "number" ||
    !title ||
    typeof title !== "string"
  ) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  try {
    const taskSet = await createTaskSet(clerkUserId, params.routineId, {
      stageNumber,
      title,
      description,
    });

    return NextResponse.json(taskSet, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: (error as Error).message === "Routine not found" ? 404 : 500 }
    );
  }
}
