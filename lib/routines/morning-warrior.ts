import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { createInitialTimeline } from "@/lib/routines/timeline";

export async function createMorningWarriorRoutine(clerkUserId: string) {
  // Find the user by their Clerk ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create the routine with wellness categories
  const [routine] = await db.insert(routines).values({
    userId: user.id,
    title: "Morning Warrior",
    routineInfo: "Wake up early and conquer your mornings with powerful habits",
    routineType: "template",
    wellnessCategories: ["body_maintenance", "personal_growth"], // Morning habits and self-improvement
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    stages: 3,
    thresholds: [7, 14, 21], // Days to advance to next stage
    currentStage: 1,
    currentStageProgress: 0,
    status: "active",
    timeline: createInitialTimeline(),
  }).returning();

  // Create taskSets for each week
  const [taskSet1] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 1,
    title: "Week One",
    description: "Foundation building week",
    scheduledHour: 6,
    scheduledMinute: 0,
  }).returning();

  const [taskSet2] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 2,
    title: "Week Two",
    description: "Habit reinforcement week",
    scheduledHour: 6,
    scheduledMinute: 0,
  }).returning();

  // Create tasks for Week One with wellness categories
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Wake up at 6 AM",
      description: "Start your day early and consistently",
      wellnessCategories: ["body_maintenance"], // Sleep schedule and daily routine
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Drink a glass of water",
      description: "Hydrate your body first thing in the morning",
      wellnessCategories: ["overall_health"], // Hydration health
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "5-minute morning stretch",
      description: "Gentle stretching to wake up your body",
      wellnessCategories: ["body"], // Physical movement
      isOptional: false,
      order: 3,
    },
  ]).returning();

  // Create tasks for Week Two
  await db.insert(tasks).values([
    {
      taskSetId: taskSet2.id,
      title: "Wake up at 6 AM",
      description: "Start your day early and consistently",
      wellnessCategories: ["body_maintenance"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Drink a glass of water",
      description: "Hydrate your body first thing in the morning",
      wellnessCategories: ["overall_health"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "5-minute morning stretch",
      description: "Gentle stretching to wake up your body",
      wellnessCategories: ["body"],
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Write 3 things you're grateful for",
      description: "Practice gratitude to start your day positively",
      wellnessCategories: ["personal_growth"], // Mental wellness and gratitude
      isOptional: true,
      order: 4,
    }
  ]);

  // Get user timezone
  const userTimezone = (await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { timezone: true }
  }))?.timezone || 'UTC';

  // Schedule for 6:00 AM TODAY in user's timezone
  const todayInUserTz = DateTime.now().setZone(userTimezone).startOf("day").plus({
    hours: taskSet1.scheduledHour || 0,
    minutes: taskSet1.scheduledMinute || 0,
  });

  const scheduledFor = todayInUserTz.toUTC().toJSDate();

  // Create active tasks with wellness categories
  const activeTasksData = weekOneTasks.map(task => ({
    userId: user.id,
    routineId: routine.id,
    originalTaskId: task.id,
    title: task.title,
    description: task.description,
    wellnessCategories: task.wellnessCategories || [], // Include wellness categories
    isOptional: task.isOptional,
    order: task.order,
    status: "todo" as const,
    scheduledFor,
  }));

  await db.insert(activeTasks).values(activeTasksData);

  return routine;
} 