import { db } from "@/lib/db";
import { unmarkedTasks, routines, users } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

// Fetch unmarked tasks for a user. If a routineId is provided, tasks
// will be limited to that routine. Otherwise, all unmarked tasks for
// the user are returned.
export async function getUnmarkedTasks(
  clerkUserId: string,
  routineId?: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  if (routineId) {
    const routine = await db.query.routines.findFirst({
      where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
      columns: { id: true },
    });

    if (!routine) throw new Error("Routine not found");

    return db.query.unmarkedTasks.findMany({
      where: and(
        eq(unmarkedTasks.userId, user.id),
        eq(unmarkedTasks.routineId, routineId),
        gte(unmarkedTasks.createdAt, startOfToday),
        lt(unmarkedTasks.createdAt, startOfTomorrow)
      ),
    });
  }

  return db.query.unmarkedTasks.findMany({
    where: and(
      eq(unmarkedTasks.userId, user.id),
      gte(unmarkedTasks.createdAt, startOfToday),
      lt(unmarkedTasks.createdAt, startOfTomorrow)
    ),
  });
}
