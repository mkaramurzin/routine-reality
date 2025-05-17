import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoutineById } from "@/lib/queries/getRoutineById";
import { updateRoutineById } from "@/lib/queries/updateRoutineById";
import { deleteRoutineById } from "@/lib/queries/deleteRoutineById";

// GET /api/routines/:id
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routine = await getRoutineById(clerkUserId, params.id);

  if (!routine) {
    return NextResponse.json({ error: "Routine not found." }, { status: 404 });
  }

  return NextResponse.json(routine);
}

// PATCH /api/routines/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const allowedFields = [
      "title",
      "routineInfo",
      "startDate",
      "endDate",
      "stages",
      "thresholds",
      "currentStage",
      "status",
    ];

    const updateData = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate as string);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate as string);
    }

    const routine = await updateRoutineById(
      clerkUserId,
      params.id,
      updateData
    );

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(routine);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/:id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedRoutine = await deleteRoutineById(clerkUserId, params.id);

    if (!deletedRoutine) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Routine deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
