import { db } from "@/lib/db";
import { taskHistory, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTaskHistory(clerkUserId: string, routineId: string) {
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

  return db.query.taskHistory.findMany({
    where: and(eq(taskHistory.userId, user.id), eq(taskHistory.routineId, routineId)),
  });
}
