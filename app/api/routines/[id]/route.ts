import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getRoutineById } from "@/lib/queries/getRoutineById";
import { updateRoutineById } from "@/lib/queries/updateRoutineById";
import { deleteRoutineById } from "@/lib/queries/deleteRoutineById";

// Helper to extract route param
function getIdFromUrl(request: NextRequest): string | null {
  const id = request.nextUrl.pathname.split("/").pop();
  return id || null;
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

  const routine = await getRoutineById(clerkUserId, id);

  if (!routine) {
    return NextResponse.json({ error: "Routine not found." }, { status: 404 });
  }

  return NextResponse.json(routine);
}

export async function PATCH(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  const body = await request.json();

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

    const routine = await updateRoutineById(clerkUserId, id, updateData);

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

export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  try {
    const deletedRoutine = await deleteRoutineById(clerkUserId, id);

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