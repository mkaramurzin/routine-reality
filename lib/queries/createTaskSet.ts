import { db } from "@/lib/db";
import { taskSets, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface NewTaskSet {
  stageNumber: number;
  title: string;
  description?: string;
  scheduledHour: number;
  scheduledMinute: number;
}

export async function createTaskSet(
  clerkUserId: string,
  routineId: string,
  data: NewTaskSet
) {
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

  const [newTaskSet] = await db
    .insert(taskSets)
    .values({
      routineId,
      stageNumber: data.stageNumber,
      title: data.title,
      description: data.description ?? null,
      scheduledHour: data.scheduledHour,
      scheduledMinute: data.scheduledMinute,
    })
    .returning();

  return newTaskSet;
}
