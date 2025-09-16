import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { DateTime } from "luxon";
import { createInitialTimeline } from "@/lib/routines/timeline";
import { type WellnessCategory } from "@/lib/wellnessColors";

interface CustomTaskData {
  title: string;
  duration: string;
  category: WellnessCategory;
  description: string;
}

export async function createCustomTaskRoutine(clerkUserId: string, taskData: CustomTaskData) {
  // Find the user by their Clerk ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true, timezone: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user already has a custom tasks routine
  const existingCustomRoutine = await db.query.routines.findFirst({
    where: and(
      eq(routines.userId, user.id),
      eq(routines.routineType, "special"),
      eq(routines.title, "Custom Tasks")
    ),
  });

  let routine;
  let taskSet;

  if (existingCustomRoutine) {
    // Use existing custom tasks routine
    routine = existingCustomRoutine;
    
    // Get the existing task set
    taskSet = await db.query.taskSets.findFirst({
      where: and(
        eq(taskSets.routineId, routine.id),
        eq(taskSets.stageNumber, 1)
      ),
    });

    if (!taskSet) {
      throw new Error("Custom tasks routine exists but task set not found");
    }
  } else {
    // Create new custom tasks routine - this is a special routine that never expires
    const [newRoutine] = await db.insert(routines).values({
      userId: user.id,
      title: "Custom Tasks",
      routineInfo: "Your personalized daily tasks",
      routineType: "special", // Special type for custom tasks
      wellnessCategories: [], // No specific categories for the routine itself
      startDate: new Date(),
      endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years from now (never expires)
      stages: 1, // Only one stage - never progresses
      thresholds: [36500], // 100 years threshold - will never be reached
      currentStage: 1,
      currentStageProgress: 0,
      status: "active",
      timeline: createInitialTimeline(),
    }).returning();

    routine = newRoutine;

    // Create the single task set for custom tasks
    const [newTaskSet] = await db.insert(taskSets).values({
      routineId: routine.id,
      stageNumber: 1,
      title: "Custom Tasks",
      description: "Your personalized daily tasks",
      scheduledHour: 8, // Default to 8 AM
      scheduledMinute: 0,
    }).returning();

    taskSet = newTaskSet;
  }

  // Create the new custom task
  const [newTask] = await db.insert(tasks).values({
    taskSetId: taskSet.id,
    title: taskData.title,
    description: `${taskData.description}\n\nDuration: ${taskData.duration}`,
    isOptional: false,
    order: await getNextTaskOrder(taskSet.id), // Get next order number
    wellnessCategories: [taskData.category], // Single category for the task
  }).returning();

  // Create an active task for today if it's past 5 AM in user's timezone
  const userTimezone = user.timezone || 'UTC';
  const userNow = DateTime.now().setZone(userTimezone);
  
  // If it's past 5 AM today, create the active task for today
  if (userNow.hour >= 5) {
    const todayScheduled = DateTime.now()
      .setZone(userTimezone)
      .startOf('day')
      .plus({ hours: taskSet.scheduledHour, minutes: taskSet.scheduledMinute })
      .toUTC()
      .toJSDate();

    // Check if active task already exists for today
    const existingActiveTask = await db.query.activeTasks.findFirst({
      where: and(
        eq(activeTasks.userId, user.id),
        eq(activeTasks.originalTaskId, newTask.id),
        eq(activeTasks.scheduledFor, todayScheduled)
      ),
    });

    if (!existingActiveTask) {
      await db.insert(activeTasks).values({
        userId: user.id,
        routineId: routine.id,
        originalTaskId: newTask.id,
        title: newTask.title,
        description: newTask.description,
        isOptional: newTask.isOptional,
        order: newTask.order,
        status: "todo",
        scheduledFor: todayScheduled,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return { routine, task: newTask };
}

// Helper function to get the next order number for tasks in a task set
async function getNextTaskOrder(taskSetId: string): Promise<number> {
  const existingTasks = await db.query.tasks.findMany({
    where: eq(tasks.taskSetId, taskSetId),
    columns: { order: true },
  });

  if (existingTasks.length === 0) {
    return 1;
  }

  const maxOrder = Math.max(...existingTasks.map(t => t.order || 0));
  return maxOrder + 1;
}
