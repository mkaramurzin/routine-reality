import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { updateActiveTaskById } from "@/lib/queries/updateActiveTask";
import { isTaskImmutable } from "@/lib/routines/taskImmutability";

// Extract task ID from /api/tasks/[id]
function getTaskIdFromUrl(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/");
  const tasksIndex = segments.indexOf("tasks");
  const taskId = tasksIndex !== -1 ? segments[tasksIndex + 1] : null;
  return taskId || null;
}

export async function PATCH(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = getTaskIdFromUrl(request);
  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("type") !== "active") {
    return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
  }

  // Check if task is immutable before allowing updates
  const taskIsImmutable = await isTaskImmutable(taskId, "active");
  if (taskIsImmutable) {
    return NextResponse.json(
      { 
        error: "This task is immutable and cannot be modified. It belongs to a previous stage that has been locked.",
        code: "TASK_IMMUTABLE"
      }, 
      { status: 403 }
    );
  }

  const body = await request.json();
  const allowedFields = ["status", "completedAt", "missedAt"];
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  if (updateData.completedAt) {
    updateData.completedAt = new Date(updateData.completedAt as string);
  }
  if (updateData.missedAt) {
    updateData.missedAt = new Date(updateData.missedAt as string);
  }

  const updated = await updateActiveTaskById(clerkUserId, taskId, updateData);

  if (!updated) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}