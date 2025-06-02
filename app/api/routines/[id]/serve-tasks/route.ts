import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { users, routines, taskSets, tasks, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Only serve tasks for active routines
    if (routine.status !== "active") {
      return NextResponse.json({ error: "Routine is not active" }, { status: 400 });
    }

    // Ensure timezone is valid, fallback to UTC if not
    let userTimezone = user.timezone || 'UTC';
    
    if (!DateTime.now().setZone(userTimezone).isValid) {
      console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
      userTimezone = 'UTC';
    }
    
    const nowUser = DateTime.now().setZone(userTimezone);
    console.log(`Manually serving tasks for routine ${routineId}, user local time: ${nowUser.toISO()}`);
    
    const currentStage = routine.currentStage;

    // Get all task sets for current stage
    const taskSetsForStage = await db.query.taskSets.findMany({
      where: (ts) => and(
        eq(ts.routineId, routine.id),
        eq(ts.stageNumber, currentStage)
      ),
    });

    console.log(`Found ${taskSetsForStage.length} task sets for routine ${routineId} at stage ${currentStage}`);

    let tasksCreated = 0;

    for (const set of taskSetsForStage) {
      // Get all template tasks for this set
      const templateTasks = await db.query.tasks.findMany({
        where: (t) => eq(t.taskSetId, set.id),
      });

      // Set scheduled time to 5:00 AM in user's timezone for today
      const scheduledTime = nowUser.set({
        hour: 5,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      // Convert to UTC for DB storage
      const scheduledForUtc = scheduledTime.toUTC().toJSDate();

      for (const task of templateTasks) {
        // Check for existing activeTask (idempotency)
        const existing = await db.query.activeTasks.findFirst({
          where: (a) =>
            and(
              eq(a.userId, user.id),
              eq(a.originalTaskId, task.id),
              eq(a.scheduledFor, scheduledForUtc)
            ),
        });

        if (!existing) {
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
            console.log(`Created active task from template ${task.id}`);
          } catch (err) {
            console.error(`Failed to create active task from template ${task.id}:`, err);
          }
        } else {
          console.log(`Task ${task.id} already has an active task for today, skipping`);
        }
      }
    }

    console.log(`Manually served ${tasksCreated} tasks for routine ${routineId}`);

    return NextResponse.json({
      success: true,
      tasksCreated,
      message: `${tasksCreated} tasks served for today`,
    });
  } catch (error) {
    console.error("Manual serve-tasks failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to serve tasks" },
      { status: 500 }
    );
  }
} 