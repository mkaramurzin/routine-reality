import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

export async function createHealthOptimizerRoutine(clerkUserId: string) {
  // Find the user by their Clerk ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create the routine
  const [routine] = await db.insert(routines).values({
    userId: user.id,
    title: "Health Optimizer",
    routineInfo: "3-week routine for peak physical performance",
    routineType: "standard",
    startDate: new Date(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    stages: 3,
    thresholds: [7, 14, 21],
    currentStage: 1,
    currentStageProgress: 0,
    status: "active",
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

  // Create tasks for Week One
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Drink 8 glasses of water",
      description: "Stay properly hydrated throughout the day",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Exercise for 30 minutes",
      description: "Any form of physical activity - walking, gym, sports, etc.",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
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
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Exercise for 45 minutes",
      description: "Increase exercise duration with varied activities",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Track your meals",
      description: "Log what you eat to become more mindful of nutrition",
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
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Exercise for 60 minutes",
      description: "Peak exercise duration with strength and cardio",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Get 7-8 hours of sleep",
      description: "Prioritize quality sleep for recovery and health",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Take a 10-minute walk after meals",
      description: "Improve digestion and maintain energy levels",
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

  const activeTasksData = weekOneTasks.map(task => ({
    userId: user.id,
    routineId: routine.id,
    originalTaskId: task.id,
    title: task.title,
    description: task.description,
    isOptional: task.isOptional,
    order: task.order,
    status: "todo" as const,
    scheduledFor,
  }));

  await db.insert(activeTasks).values(activeTasksData);

  return routine;
} 