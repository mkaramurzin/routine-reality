import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import {
  users,
  routines,
  taskSets,
  tasks,
  activeTasks,
  unmarkedTasks,
  taskHistory,
} from "@/lib/db/schema";
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
    // Get the user to check timezone
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

    // Don't allow reset of finished routines
    if (routine.status === "finished") {
      return NextResponse.json({ error: "Cannot reset a finished routine" }, { status: 400 });
    }

    console.log(`Resetting routine ${routineId} for user ${user.id}`);

    // Step 1: Delete all current active tasks for this routine
    const deletedActiveTasks = await db.delete(activeTasks)
      .where(
        and(eq(activeTasks.userId, user.id), eq(activeTasks.routineId, routine.id))
      )
      .returning();

    console.log(
      `Deleted ${deletedActiveTasks.length} active tasks for routine ${routineId}`
    );

    // Also clear any unmarked tasks and task history entries for this routine
    const deletedUnmarkedTasks = await db.delete(unmarkedTasks)
      .where(
        and(
          eq(unmarkedTasks.userId, user.id),
          eq(unmarkedTasks.routineId, routine.id)
        )
      )
      .returning();

    const deletedHistoryTasks = await db.delete(taskHistory)
      .where(
        and(
          eq(taskHistory.userId, user.id),
          eq(taskHistory.routineId, routine.id)
        )
      )
      .returning();

    const totalTasksDeleted =
      deletedActiveTasks.length +
      deletedUnmarkedTasks.length +
      deletedHistoryTasks.length;

    // Step 2: Reset routine to stage 1 with timeline event and reactivate if abandoned
    const currentTimeline = (routine.timeline as RoutineTimeline) || [];
    const updatedTimeline = addTimelineEvent(currentTimeline, {
      type: "reset",
    });

    // If routine is abandoned, reactivate it during reset
    const currentStatus = routine.status || "active";
    const newStatus = currentStatus === "abandoned" ? "active" : currentStatus;

    await updateRoutineById(clerkUserId, routineId, {
      currentStage: 1,
      currentStageProgress: 0,
      status: newStatus,
      timeline: updatedTimeline,
    });

    console.log(`Reset routine ${routineId} to stage 1${currentStatus === "abandoned" ? " and reactivated" : ""}`);

    // Step 3: Serve Stage 1 tasks immediately (if routine is now active)
    let tasksCreated = 0;
    
    if (newStatus === "active") {
      // Ensure timezone is valid, fallback to UTC if not
      let userTimezone = user.timezone || 'UTC';
      
      if (!DateTime.now().setZone(userTimezone).isValid) {
        console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
        userTimezone = 'UTC';
      }
      
      const nowUser = DateTime.now().setZone(userTimezone);

      // Get all task sets for stage 1
      const taskSetsForStage = await db.query.taskSets.findMany({
        where: (ts) => and(
          eq(ts.routineId, routine.id),
          eq(ts.stageNumber, 1)
        ),
      });

      console.log(`Found ${taskSetsForStage.length} task sets for stage 1 of routine ${routineId}`);

      for (const set of taskSetsForStage) {
        // Get all template tasks for this set
        const templateTasks = await db.query.tasks.findMany({
          where: (t) => eq(t.taskSetId, set.id),
        });

        // For reset, schedule tasks immediately (current time) instead of 5 AM
        // This ensures tasks are available right away after reset
        const scheduledForUtc = nowUser.toUTC().toJSDate();

        for (const task of templateTasks) {
          try {
            await db.insert(activeTasks).values({
              userId: user.id,
              routineId: routine.id,
              originalTaskId: task.id,
              title: task.title,
              description: task.description,
              isOptional: task.isOptional,
              order: task.order,
              status: "todo",
              scheduledFor: scheduledForUtc,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            tasksCreated++;
            console.log(`Created new active task from template ${task.id} for stage 1`);
          } catch (err) {
            console.error(`Failed to create active task from template ${task.id}:`, err);
          }
        }
      }
    }

    console.log(
      `Reset complete: deleted ${totalTasksDeleted} tasks, created ${tasksCreated} new tasks`
    );

    const wasAbandoned = currentStatus === "abandoned";
    
    return NextResponse.json({
      success: true,
      tasksDeleted: totalTasksDeleted,
      tasksCreated,
      wasReactivated: wasAbandoned,
      message: `Routine reset to Stage 1${wasAbandoned ? " and reactivated" : ""}. ${totalTasksDeleted} old tasks deleted, ${tasksCreated} new tasks created.`,
    });
  } catch (error) {
    console.error("Routine reset failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to reset routine" },
      { status: 500 }
    );
  }
} 