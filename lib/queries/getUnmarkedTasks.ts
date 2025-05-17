import { db } from "@/lib/db";
import { unmarkedTasks, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUnmarkedTasks(clerkUserId: string, routineId: string) {
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

  return db.query.unmarkedTasks.findMany({
    where: and(eq(unmarkedTasks.userId, user.id), eq(unmarkedTasks.routineId, routineId)),
  });
}
