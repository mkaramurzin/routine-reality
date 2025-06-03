import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { createInitialTimeline } from "@/lib/routines/timeline";

export async function createHealthOptimizerRoutine(clerkUserId: string) {
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
    title: "Health Optimizer",
    routineInfo: "Build lasting health habits with nutrition, exercise, and recovery",
    routineType: "template",
    wellnessCategories: ["overall_health", "body", "body_maintenance"], // Comprehensive health focus
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
    title: "Week One - Foundation",
    description: "Building healthy habits foundation",
    scheduledHour: 7,
    scheduledMinute: 0,
  }).returning();

  const [taskSet2] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 2,
    title: "Week Two - Optimization",
    description: "Optimizing nutrition and exercise",
    scheduledHour: 7,
    scheduledMinute: 0,
  }).returning();

  const [taskSet3] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 3,
    title: "Week Three - Peak Performance",
    description: "Achieving peak physical performance",
    scheduledHour: 7,
    scheduledMinute: 0,
  }).returning();

  // Create tasks for Week One with wellness categories
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Drink 8 glasses of water",
      description: "Stay properly hydrated throughout the day",
      wellnessCategories: ["overall_health"], // Hydration health
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Exercise for 30 minutes",
      description: "Any form of physical activity - walking, gym, sports, etc.",
      wellnessCategories: ["body"], // Physical fitness
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
      wellnessCategories: ["body_maintenance"], // Sleep and recovery
      isOptional: false,
      order: 3,
    },
  ]).returning();

  // Create tasks for Week Two
  await db.insert(tasks).values([
    {
      taskSetId: taskSet2.id,
      title: "Drink 8 glasses of water",
      description: "Stay properly hydrated throughout the day",
      wellnessCategories: ["overall_health"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Exercise for 45 minutes",
      description: "Increase exercise duration with varied activities",
      wellnessCategories: ["body"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
      wellnessCategories: ["body_maintenance"],
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Track your meals",
      description: "Log what you eat to become more mindful of nutrition",
      wellnessCategories: ["overall_health"], // Nutrition awareness
      isOptional: true,
      order: 4,
    }
  ]);

  // Create tasks for Week Three
  await db.insert(tasks).values([
    {
      taskSetId: taskSet3.id,
      title: "Drink 8 glasses of water",
      description: "Stay properly hydrated throughout the day",
      wellnessCategories: ["overall_health"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Exercise for 60 minutes",
      description: "Peak exercise duration with strength and cardio",
      wellnessCategories: ["body"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
      wellnessCategories: ["body_maintenance"],
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Take a 10-minute walk after meals",
      description: "Improve digestion and maintain energy levels",
      wellnessCategories: ["body"], // Physical movement and digestion
      isOptional: true,
      order: 4,
    }
  ]);

  // Get user timezone
  const userTimezone = (await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { timezone: true }
  }))?.timezone || 'UTC';

  // Schedule for 7:00 AM TODAY in user's timezone
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