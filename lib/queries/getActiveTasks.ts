import { db } from "@/lib/db";
import { activeTasks, routines, users } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function getActiveTasksForToday(clerkUserId: string, routineId: string, date: Date) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: { id: true },
  });

  if (!routine) throw new Error("Routine not found");

  // Date range for today
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return db.query.activeTasks.findMany({
    where: and(
      eq(activeTasks.userId, user.id),
      eq(activeTasks.routineId, routineId),
      gte(activeTasks.scheduledFor, start),
      lte(activeTasks.scheduledFor, end)
    ),
  });
}
