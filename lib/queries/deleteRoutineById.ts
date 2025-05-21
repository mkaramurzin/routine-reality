import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function deleteRoutineById(clerkUserId: string, routineId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const [deletedRoutine] = await db
    .delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, user.id)))
    .returning({ id: routines.id });

  return deletedRoutine;
}
