import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tasks, taskSets, routines, activeTasks, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First, get the active task to find the original task ID
    const activeTask = await db.query.activeTasks.findFirst({
      where: and(
        eq(activeTasks.id, taskId),
        eq(activeTasks.userId, user.id)
      ),
      columns: { 
        originalTaskId: true, 
        routineId: true, 
        title: true 
      },
    });

    if (!activeTask) {
      return NextResponse.json({ error: "Active task not found" }, { status: 404 });
    }

    // Check if originalTaskId exists (required for custom tasks)
    if (!activeTask.originalTaskId) {
      return NextResponse.json({ error: "Invalid task - no original task ID" }, { status: 400 });
    }

    // Verify this is a custom task by checking the routine
    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, activeTask.routineId),
      columns: { title: true, routineType: true },
    });

    if (!routine || routine.title !== "Custom Tasks" || routine.routineType !== "special") {
      return NextResponse.json({ 
        error: "Only custom tasks can be deleted" 
      }, { status: 403 });
    }

    // Get the original task to find the task set
    const originalTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, activeTask.originalTaskId),
      columns: { taskSetId: true },
    });

    if (!originalTask) {
      return NextResponse.json({ error: "Original task not found" }, { status: 404 });
    }

    // Delete all active tasks for this original task (past, present, and future)
    await db.delete(activeTasks).where(
      and(
        eq(activeTasks.originalTaskId, activeTask.originalTaskId),
        eq(activeTasks.userId, user.id)
      )
    );

    // Delete the original task template
    await db.delete(tasks).where(eq(tasks.id, activeTask.originalTaskId));

    // Check if this was the last task in the custom tasks routine
    const remainingTasks = await db.query.tasks.findMany({
      where: eq(tasks.taskSetId, originalTask.taskSetId),
      columns: { id: true },
    });

    // If no more custom tasks exist, we could optionally clean up the routine
    // For now, we'll keep the routine structure for future custom tasks

    return NextResponse.json({ 
      success: true, 
      message: `Custom task "${activeTask.title}" has been permanently deleted.`
    });

  } catch (error) {
    console.error("Error deleting custom task:", error);
    return NextResponse.json(
      { error: "Failed to delete custom task" },
      { status: 500 }
    );
  }
}
