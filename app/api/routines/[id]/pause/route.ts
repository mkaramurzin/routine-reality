import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, routines, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateRoutineById } from "@/lib/queries/updateRoutineById";
import { addTimelineEvent, RoutineTimeline } from "@/lib/routines/timeline";

// Helper to extract route param
function getIdFromUrl(request: NextRequest): string | null {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/");
  const routineIndex = segments.findIndex(segment => segment === "routines");
  return routineIndex !== -1 && segments[routineIndex + 1] ? segments[routineIndex + 1] : null;
}

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routineId = getIdFromUrl(request);
  if (!routineId) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  try {
    // Get the user
    const user = await db.query.users.findFirst({
      where: (u) => eq(u.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the specific routine and verify ownership
    const routine = await db.query.routines.findFirst({
      where: (r) => and(eq(r.id, routineId), eq(r.userId, user.id)),
    });

    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    // Only allow pausing active routines
    if (routine.status !== "active") {
      return NextResponse.json({ error: "Routine is not active" }, { status: 400 });
    }

    console.log(`Pausing routine ${routineId} for user ${user.id}`);

    // Step 1: Get all current active tasks for this routine to count completed ones
    const currentActiveTasks = await db.query.activeTasks.findMany({
      where: and(
        eq(activeTasks.userId, user.id),
        eq(activeTasks.routineId, routine.id)
      ),
    });

    // Count completed non-optional tasks (these contributed to stage progress)
    const completedTasksCount = currentActiveTasks.filter(task => 
      task.status === "completed" && !task.isOptional
    ).length;

    console.log(`Found ${completedTasksCount} completed non-optional tasks that contributed to progress`);

    // Step 2: Delete all current active tasks for this routine
    const deletedTasks = await db.delete(activeTasks)
      .where(and(
        eq(activeTasks.userId, user.id),
        eq(activeTasks.routineId, routine.id)
      ))
      .returning();

    console.log(`Deleted ${deletedTasks.length} active tasks for routine ${routineId}`);

    // Step 3: Calculate adjusted stage progress by subtracting completed tasks
    // This prevents gaming where users complete tasks, pause, resume, and complete more
    const adjustedProgress = Math.max(0, routine.currentStageProgress - completedTasksCount);

    console.log(`Adjusting stage progress: ${routine.currentStageProgress} - ${completedTasksCount} = ${adjustedProgress}`);

    // Step 4: Update routine status to paused with adjusted progress
    const currentTimeline = (routine.timeline as RoutineTimeline) || [];
    const updatedTimeline = addTimelineEvent(currentTimeline, {
      type: "paused",
    });

    await updateRoutineById(clerkUserId, routineId, {
      status: "paused",
      currentStageProgress: adjustedProgress,
      timeline: updatedTimeline,
    });

    console.log(`Paused routine ${routineId} with adjusted progress: ${adjustedProgress}`);

    return NextResponse.json({
      success: true,
      tasksDeleted: deletedTasks.length,
      completedTasksSubtracted: completedTasksCount,
      adjustedProgress: adjustedProgress,
      message: `Routine paused. ${deletedTasks.length} active tasks deleted, progress adjusted by -${completedTasksCount}.`,
    });
  } catch (error) {
    console.error("Routine pause failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to pause routine" },
      { status: 500 }
    );
  }
} 