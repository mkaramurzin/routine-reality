import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { createInitialTimeline } from "@/lib/routines/timeline";

export async function createMonkModeRoutine(clerkUserId: string) {
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
    title: "Monk Mode",
    routineInfo: "Achieve deep focus and productivity through disciplined daily habits",
    routineType: "template",
    wellnessCategories: ["personal_growth", "brainy", "body_maintenance"], // Focus, mental clarity, discipline
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
    description: "Tasks for the first week",
    scheduledHour: 5,
    scheduledMinute: 0,
  }).returning();

  const [taskSet2] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 2,
    title: "Week Two",
    description: "Tasks for the second week",
    scheduledHour: 5,
    scheduledMinute: 0,
  }).returning();

  const [taskSet3] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 3,
    title: "Week Three",
    description: "Tasks for the third week",
    scheduledHour: 5,
    scheduledMinute: 0,
  }).returning();

  // Create tasks for Week One with wellness categories
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Meditate for 10 minutes",
      description: "Meditate for 10 minutes",
      wellnessCategories: ["brainy", "personal_growth"], // Mental wellness and self-improvement
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      wellnessCategories: ["body"], // Physical fitness
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      wellnessCategories: ["overall_health"], // Health habit
      isOptional: false,
      order: 3,
    },
  ]).returning();

  // Create tasks for Week Two
  await db.insert(tasks).values([
    {
      taskSetId: taskSet2.id,
      title: "Meditate for 10 minutes",
      description: "Meditate for 10 minutes",
      wellnessCategories: ["brainy", "personal_growth"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      wellnessCategories: ["body"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      wellnessCategories: ["overall_health"],
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Weekly Variable",
      description: "Read 10 pages of a book",
      wellnessCategories: ["brainy"], // Mental development
      isOptional: true,
      order: 4,
    }
  ]);

  // Create tasks for Week Three
  await db.insert(tasks).values([
    {
      taskSetId: taskSet3.id,
      title: "Meditate for 10 minutes",
      description: "Meditate for 10 minutes",
      wellnessCategories: ["brainy", "personal_growth"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      wellnessCategories: ["body"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      wellnessCategories: ["overall_health"],
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Weekly Variable",
      description: "Call a parent or family member",
      wellnessCategories: ["personal_growth"], // Relationship and personal development
      isOptional: true,
      order: 4,
    }
  ]);

  // Retrieve the user's timezone (already queried above)
  const userTimezone = (await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { timezone: true }
  }))?.timezone || 'UTC';

  // Schedule for 5:00 AM TODAY in user's timezone, stored as UTC
  const todayInUserTz = DateTime.now().setZone(userTimezone).startOf("day").plus({
    hours: taskSet1.scheduledHour || 0,
    minutes: taskSet1.scheduledMinute || 0,
  });

  // Store in UTC for consistency
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