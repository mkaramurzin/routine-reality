import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

export async function createProductivityBeastRoutine(clerkUserId: string) {
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
    title: "Productivity Beast",
    routineInfo: "4-week routine to maximize focus and output",
    routineType: "standard",
    startDate: new Date(),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    stages: 4,
    thresholds: [7, 14, 21, 28],
    currentStage: 1,
    currentStageProgress: 0,
    status: "active",
  }).returning();

  // Create taskSets for each week
  const [taskSet1] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 1,
    title: "Week One - Foundation",
    description: "Building basic productivity habits",
    scheduledHour: 8,
    scheduledMinute: 0,
  }).returning();

  const [taskSet2] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 2,
    title: "Week Two - Time Blocking",
    description: "Implementing structured time management",
    scheduledHour: 8,
    scheduledMinute: 0,
  }).returning();

  const [taskSet3] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 3,
    title: "Week Three - Deep Work",
    description: "Mastering focused work sessions",
    scheduledHour: 8,
    scheduledMinute: 0,
  }).returning();

  const [taskSet4] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 4,
    title: "Week Four - Optimization",
    description: "Fine-tuning your productivity system",
    scheduledHour: 8,
    scheduledMinute: 0,
  }).returning();

  // Create tasks for Week One
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Plan your top 3 priorities",
      description: "Identify the 3 most important tasks for the day",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Complete one focused work session",
      description: "Work on your most important task for 25 minutes without distractions",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Review and organize your workspace",
      description: "Clean and organize your physical and digital workspace",
      isOptional: false,
      order: 3,
    },
  ]).returning();

  // Create tasks for Week Two
  await db.insert(tasks).values([
    {
      taskSetId: taskSet2.id,
      title: "Plan your top 3 priorities",
      description: "Identify the 3 most important tasks for the day",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Complete two focused work sessions",
      description: "Work on important tasks for two 25-minute sessions",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Time-block your calendar",
      description: "Schedule specific time blocks for different types of work",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Eliminate one distraction",
      description: "Identify and remove one source of distraction from your environment",
      isOptional: true,
      order: 4,
    }
  ]);

  // Create tasks for Week Three
  await db.insert(tasks).values([
    {
      taskSetId: taskSet3.id,
      title: "Plan your top 3 priorities",
      description: "Identify the 3 most important tasks for the day",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Complete three focused work sessions",
      description: "Work on important tasks for three 25-minute sessions",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Practice deep work for 90 minutes",
      description: "Work on your most challenging task for 90 minutes straight",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Track your energy levels",
      description: "Note when you feel most and least energetic throughout the day",
      isOptional: true,
      order: 4,
    }
  ]);

  // Create tasks for Week Four
  await db.insert(tasks).values([
    {
      taskSetId: taskSet4.id,
      title: "Plan your top 3 priorities",
      description: "Identify the 3 most important tasks for the day",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet4.id,
      title: "Complete four focused work sessions",
      description: "Work on important tasks for four 25-minute sessions",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet4.id,
      title: "Optimize your productivity system",
      description: "Review and improve your productivity methods based on what you've learned",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet4.id,
      title: "Plan next week's goals",
      description: "Set clear objectives for the following week",
      isOptional: true,
      order: 4,
    }
  ]);

  // Get user timezone
  const userTimezone = (await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { timezone: true }
  }))?.timezone || 'UTC';

  // Schedule for 8:00 AM TODAY in user's timezone
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