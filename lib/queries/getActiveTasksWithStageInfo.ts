import { db } from "@/lib/db";
import { activeTasks, routines, users, tasks, taskSets } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { DateTime } from "luxon";

export async function getActiveTasksWithStageInfo(clerkUserId: string, routineId?: string, targetDate?: Date) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true, timezone: true },
  });

  if (!user) throw new Error("User not found");

  // Ensure timezone is valid, fallback to UTC if not
  let userTimezone = user.timezone || 'UTC';
  if (!DateTime.now().setZone(userTimezone).isValid) {
    console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
    userTimezone = 'UTC';
  }

  // Use targetDate if provided, otherwise use current time
  const baseTime = targetDate ? DateTime.fromJSDate(targetDate) : DateTime.now();
  
  // Get the target date in the user's timezone
  const userDate = baseTime.setZone(userTimezone);
  
  // Calculate start and end of the day in user's timezone
  const startOfDay = userDate.startOf('day');
  const endOfDay = userDate.endOf('day');
  
  // Convert to UTC for database queries
  const startUtc = startOfDay.toUTC().toJSDate();
  const endUtc = endOfDay.toUTC().toJSDate();

  // Build where conditions
  let whereConditions = [
    eq(activeTasks.userId, user.id),
    gte(activeTasks.scheduledFor, startUtc),
    lte(activeTasks.scheduledFor, endUtc)
  ];

  if (routineId) {
    whereConditions.push(eq(activeTasks.routineId, routineId));
  }

  // Get active tasks with their routine info
  const activeTasksData = await db.query.activeTasks.findMany({
    where: and(...whereConditions),
    with: {
      routine: {
        columns: {
          id: true,
          title: true,
          currentStage: true,
        }
      }
    }
  });

  // Enhance tasks with stage information and immutability status
  const enhancedTasks = [];

  for (const activeTask of activeTasksData) {
    let stageNumber: number | null = null;
    let isImmutable = false;

    // Get stage information if we have an originalTaskId
    if (activeTask.originalTaskId) {
      const originalTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, activeTask.originalTaskId),
        columns: { taskSetId: true },
      });

      if (originalTask) {
        const taskSet = await db.query.taskSets.findFirst({
          where: eq(taskSets.id, originalTask.taskSetId),
          columns: { stageNumber: true },
        });

        if (taskSet) {
          stageNumber = taskSet.stageNumber;
          // Task is immutable if its stage is less than current routine stage
          isImmutable = taskSet.stageNumber < activeTask.routine.currentStage;
        }
      }
    }

    enhancedTasks.push({
      ...activeTask,
      stageNumber,
      isImmutable,
      routineTitle: activeTask.routine.title,
    });
  }

  return enhancedTasks;
} 