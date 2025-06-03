import { db } from "@/lib/db";
import { routines, taskSets, tasks, users, activeTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { createInitialTimeline } from "@/lib/routines/timeline";

export async function createProductivityBeastRoutine(clerkUserId: string) {
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
    title: "Productivity Beast",
    routineInfo: "Maximize your output and crush your goals with intense focus sessions",
    routineType: "template",
    wellnessCategories: ["brainy", "personal_growth", "money"], // Mental focus, self-improvement, work productivity
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    stages: 3,
    thresholds: [2, 14, 21], // Days to advance to next stage
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

  // Create tasks for Week One with wellness categories
  const weekOneTasks = await db.insert(tasks).values([
    {
      taskSetId: taskSet1.id,
      title: "Plan your top 3 priorities",
      description: "Identify the 3 most important tasks for the day",
      wellnessCategories: ["brainy", "personal_growth"], // Mental planning and goal setting
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet1.id,
      title: "Complete one focused work session",
      description: "Work on your most important task for 25 minutes without distractions",
      wellnessCategories: ["brainy"], // Cognitive focus
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet1.id,
      title: "Review and organize your workspace",
      description: "Clean and organize your physical and digital workspace",
      wellnessCategories: ["personal_growth"], // Organization and efficiency
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
      wellnessCategories: ["brainy", "personal_growth"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet2.id,
      title: "Complete two focused work sessions",
      description: "Work on important tasks for two 25-minute sessions",
      wellnessCategories: ["brainy"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet2.id,
      title: "Time-block your calendar",
      description: "Schedule specific time blocks for different types of work",
      wellnessCategories: ["personal_growth"], // Time management skills
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet2.id,
      title: "Eliminate one distraction",
      description: "Identify and remove one source of distraction from your environment",
      wellnessCategories: ["brainy"], // Mental clarity and focus
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
      wellnessCategories: ["brainy", "personal_growth"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet3.id,
      title: "Complete three focused work sessions",
      description: "Work on important tasks for three 25-minute sessions",
      wellnessCategories: ["brainy"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet3.id,
      title: "Practice deep work for 90 minutes",
      description: "Work on your most challenging task for 90 minutes straight",
      wellnessCategories: ["brainy"], // Deep cognitive work
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet3.id,
      title: "Track your energy levels",
      description: "Note when you feel most and least energetic throughout the day",
      wellnessCategories: ["personal_growth"], // Self-awareness
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
      wellnessCategories: ["brainy", "personal_growth"],
      isOptional: false,
      order: 1,
    },
    {
      taskSetId: taskSet4.id,
      title: "Complete four focused work sessions",
      description: "Work on important tasks for four 25-minute sessions",
      wellnessCategories: ["brainy"],
      isOptional: false,
      order: 2,
    },
    {
      taskSetId: taskSet4.id,
      title: "Optimize your productivity system",
      description: "Review and improve your productivity methods based on what you've learned",
      wellnessCategories: ["personal_growth"], // System optimization
      isOptional: false,
      order: 3,
    },
    {
      taskSetId: taskSet4.id,
      title: "Plan next week's goals",
      description: "Set clear objectives for the following week",
      wellnessCategories: ["money"], // Goal setting for work/financial success
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