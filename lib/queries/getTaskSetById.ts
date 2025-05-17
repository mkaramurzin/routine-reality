import { db } from "@/lib/db";
import { taskSets, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTaskSetById(clerkUserId: string, taskSetId: string) {
  return db
    .select({
      id: taskSets.id,
      routineId: taskSets.routineId,
      stageNumber: taskSets.stageNumber,
      title: taskSets.title,
      description: taskSets.description,
      createdAt: taskSets.createdAt,
      updatedAt: taskSets.updatedAt,
    })
    .from(taskSets)
    .innerJoin(routines, eq(taskSets.routineId, routines.id))
    .innerJoin(users, eq(routines.userId, users.id))
    .where(
      and(
        eq(taskSets.id, taskSetId),
        eq(users.clerkUserId, clerkUserId)
      )
    )
    .then(rows => rows[0] ?? null);
}
