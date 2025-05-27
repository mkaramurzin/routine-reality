import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

export async function createMorningWarriorRoutine(clerkUserId: string) {
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
    title: "Morning Warrior",
    routineInfo: "2-week routine to establish a powerful morning routine",
    routineType: "standard",
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    stages: 2,
    thresholds: [7, 14],
    currentStage: 1,
    currentStageProgress: 0,
    status: "active",
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

  // Create tasks for Week One
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Wake up at 6 AM",
      description: "Start your day early and consistently",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Drink a glass of water",
      description: "Hydrate your body first thing in the morning",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "5-minute morning stretch",
      description: "Gentle stretching to wake up your body",
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
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Drink a glass of water",
      description: "Hydrate your body first thing in the morning",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "5-minute morning stretch",
      description: "Gentle stretching to wake up your body",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Write 3 things you're grateful for",
      description: "Practice gratitude to start your day positively",
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