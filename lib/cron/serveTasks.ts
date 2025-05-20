import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { users, routines, taskSets, tasks, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Frequency your cron runs, in minutes
const CRON_WINDOW_MINUTES = 15;

// Main function
export async function serveTasksForAllUsers() {
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const nowUser = DateTime.now().setZone(user.timezone);

    // All active routines for user
    const userRoutines = await db.query.routines.findMany({
      where: (r) => and(eq(r.userId, user.id), eq(r.status, "active")),
    });

    for (const routine of userRoutines) {
      const currentStage = routine.currentStage;

      // All task sets for current stage
      const taskSetsForStage = await db.query.taskSets.findMany({
        where: (ts) => and(
          eq(ts.routineId, routine.id),
          eq(ts.stageNumber, currentStage)
        ),
      });

      for (const set of taskSetsForStage) {
        // If no scheduledHour/Minute, skip
        if (set.scheduledHour == null || set.scheduledMinute == null) continue;

        // Is it now? (within CRON_WINDOW_MINUTES)
        const scheduledTime = nowUser.set({
          hour: set.scheduledHour,
          minute: set.scheduledMinute,
          second: 0,
          millisecond: 0,
        });

        const diff = Math.abs(nowUser.diff(scheduledTime, "minutes").minutes);

        // If the scheduled time for this segment is within the window
        if (diff < CRON_WINDOW_MINUTES) {
          // All template tasks for this set
          const templateTasks = await db.query.tasks.findMany({
            where: (t) => eq(t.taskSetId, set.id),
          });

          // Schedule time in UTC for DB consistency
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
            }
          }
        }
      }
    }
  }
}