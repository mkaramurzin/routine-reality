import { db } from "@/lib/db";
import { taskSets, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTaskSetsForRoutine(clerkUserId: string, routineId: string) {
  // Ensure the routine belongs to user
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

  return db.query.taskSets.findMany({
    where: eq(taskSets.routineId, routineId),
  });
}
