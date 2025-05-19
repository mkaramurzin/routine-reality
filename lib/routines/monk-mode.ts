import { db } from "@/lib/db";
import { routines, taskSets, tasks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createMonkModeRoutine(clerkUserId: string) {
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
    title: "|Monk Mode|",
    routineInfo: "3-week routine to get you success-oriented",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    stages: 3,
    thresholds: [21, 28, 28],
    currentStage: 1,
    status: "active",
  }).returning();

  // Create taskSets for each week
  const [taskSet1] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 1,
    title: "Week One",
    description: "Tasks for the first week",
  }).returning();

  const [taskSet2] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 2,
    title: "Week Two",
    description: "Tasks for the second week",
  }).returning();

  const [taskSet3] = await db.insert(taskSets).values({
    routineId: routine.id,
    stageNumber: 3,
    title: "Week Three",
    description: "Tasks for the third week",
  }).returning();

  // Create tasks for Week One
  await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Meditate for 10 minutes",
      description: "Meditate for 10 minutes",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      isOptional: false,
      order: 3,
    },
  ]);

  // Create tasks for Week Two
  await db.insert(tasks).values([
    {
      taskSetId: taskSet2.id,
      title: "Meditate for 10 minutes",
      description: "Meditate for 10 minutes",
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Weekly Variable",
      description: "Read 10 pages of a book",
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
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Exercise for 30 minutes",
      description: "Do a workout, run, play a sport, or anything that gets your body moving",
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Go to bed sober",
      description: "No weed or alcohol",
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Weekly Variable",
      description: "Call a parent or family member",
      isOptional: true,
      order: 4,
    }
  ]);

  return routine;
} 