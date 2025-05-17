import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTaskSetById } from "@/lib/queries/getTaskSetById";
import { updateTaskSetById } from "@/lib/queries/updateTaskSetById";
import { deleteTaskSetById } from "@/lib/queries/deleteTaskSetById";

export async function GET(
  req: Request,
  { params }: { params: { taskSetId: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskSet = await getTaskSetById(clerkUserId, params.taskSetId);
  if (!taskSet) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json(taskSet);
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskSetId: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = ["stageNumber", "title", "description"];
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  const updated = await updateTaskSetById(clerkUserId, params.taskSetId, updateData);

  if (!updated) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskSetId: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteTaskSetById(clerkUserId, params.taskSetId);

  if (!deleted) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Task set deleted successfully." });
}
