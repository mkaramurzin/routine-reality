import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getTaskSetById } from "@/lib/queries/getTaskSetById";
import { updateTaskSetById } from "@/lib/queries/updateTaskSetById";
import { deleteTaskSetById } from "@/lib/queries/deleteTaskSetById";

// Extracts [id] from /api/task-sets/[id]
function getTaskSetIdFromUrl(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/");
  const taskSetId = segments[segments.indexOf("task-sets") + 1];
  return taskSetId || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskSetId = getTaskSetIdFromUrl(request);
  if (!taskSetId) {
    return NextResponse.json({ error: "Missing taskSetId" }, { status: 400 });
  }

  const taskSet = await getTaskSetById(clerkUserId, taskSetId);
  if (!taskSet) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json(taskSet);
}

export async function PATCH(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskSetId = getTaskSetIdFromUrl(request);
  if (!taskSetId) {
    return NextResponse.json({ error: "Missing taskSetId" }, { status: 400 });
  }

  const body = await request.json();
  const allowedFields = ["stageNumber", "title", "description"];
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  const updated = await updateTaskSetById(clerkUserId, taskSetId, updateData);
  if (!updated) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskSetId = getTaskSetIdFromUrl(request);
  if (!taskSetId) {
    return NextResponse.json({ error: "Missing taskSetId" }, { status: 400 });
  }

  const deleted = await deleteTaskSetById(clerkUserId, taskSetId);
  if (!deleted) {
    return NextResponse.json({ error: "Task set not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Task set deleted successfully." });
}