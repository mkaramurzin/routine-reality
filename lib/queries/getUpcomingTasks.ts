import { db } from "@/lib/db";
import { users, routines, taskSets, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { DateTime } from "luxon";

interface UpcomingTask {
  id: string; // This will be the template task ID
  title: string;
  description: string | null;
  isOptional: boolean;
  order: number | null;
  status: "upcoming";
  stageNumber: number;
  routineTitle: string;
  routineId: string;
  scheduledFor: Date;
  isSkipped?: boolean; // For tasks that user has pre-skipped
}

export async function getUpcomingTasks(clerkUserId: string): Promise<UpcomingTask[]> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true, timezone: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Ensure timezone is valid, fallback to UTC if not
  let userTimezone = user.timezone || 'UTC';
  if (!DateTime.now().setZone(userTimezone).isValid) {
    console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
    userTimezone = 'UTC';
  }

  // Get tomorrow at 5:00 AM in user's timezone
  const tomorrowAt5AM = DateTime.now()
    .setZone(userTimezone)
    .plus({ days: 1 })
    .set({ hour: 5, minute: 0, second: 0, millisecond: 0 });

  const scheduledForUtc = tomorrowAt5AM.toUTC().toJSDate();

  // Get all active routines for user
  const userRoutines = await db.query.routines.findMany({
    where: (r) => and(eq(r.userId, user.id), eq(r.status, "active")),
  });

  const upcomingTasks: UpcomingTask[] = [];

  for (const routine of userRoutines) {
    const currentStage = routine.currentStage;

    // Get task sets for current stage
    const taskSetsForStage = await db.query.taskSets.findMany({
      where: (ts) => and(
        eq(ts.routineId, routine.id),
        eq(ts.stageNumber, currentStage)
      ),
    });

    for (const set of taskSetsForStage) {
      // Get all template tasks for this set
      const templateTasks = await db.query.tasks.findMany({
        where: (t) => eq(t.taskSetId, set.id),
      });

      for (const task of templateTasks) {
        upcomingTasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          isOptional: task.isOptional || false,
          order: task.order,
          status: "upcoming",
          stageNumber: currentStage,
          routineTitle: routine.title,
          routineId: routine.id,
          scheduledFor: scheduledForUtc,
          isSkipped: false, // Will be updated on client side based on localStorage
        });
      }
    }
  }

  return upcomingTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
}

// Utility function to get skipped task IDs from localStorage (client-side only)
export function getSkippedTaskIds(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem('skippedUpcomingTasks');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
} 