import { db } from "@/lib/db";
import { activeTasks, routines, users } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { DateTime } from "luxon";

export async function getActiveTasksForToday(clerkUserId: string, routineId: string, targetDate?: Date) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true, timezone: true },
  });

  if (!user) throw new Error("User not found");

  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: { id: true },
  });

  if (!routine) throw new Error("Routine not found");

  // Ensure timezone is valid, fallback to UTC if not
  let userTimezone = user.timezone || 'UTC';
  if (!DateTime.now().setZone(userTimezone).isValid) {
    console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
    userTimezone = 'UTC';
  }

  // Use targetDate if provided, otherwise use current time
  const baseTime = targetDate ? DateTime.fromJSDate(targetDate) : DateTime.now();
  
  // Get the target date in the user's timezone
  const userDate = baseTime.setZone(userTimezone);
  
  // Calculate start and end of the day in user's timezone
  const startOfDay = userDate.startOf('day');
  const endOfDay = userDate.endOf('day');
  
  // Convert to UTC for database queries
  const startUtc = startOfDay.toUTC().toJSDate();
  const endUtc = endOfDay.toUTC().toJSDate();

  return db.query.activeTasks.findMany({
    where: and(
      eq(activeTasks.userId, user.id),
      eq(activeTasks.routineId, routineId),
      gte(activeTasks.scheduledFor, startUtc),
      lte(activeTasks.scheduledFor, endUtc)
    ),
  });
}
