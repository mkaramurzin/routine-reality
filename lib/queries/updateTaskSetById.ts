import { db } from "@/lib/db";
import { taskSets, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface UpdateTaskSetData {
  stageNumber?: number;
  title?: string;
  description?: string;
}

export async function updateTaskSetById(
  clerkUserId: string,
  taskSetId: string,
  data: UpdateTaskSetData
) {
  const taskSet = await db
    .select({ routineId: taskSets.routineId })
    .from(taskSets)
    .where(eq(taskSets.id, taskSetId))
    .then(rows => rows[0]);

  if (!taskSet) return null;

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, taskSet.routineId),
    columns: { userId: true },
  });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!routine || !user || routine.userId !== user.id) return null;

  const [updated] = await db
    .update(taskSets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(taskSets.id, taskSetId))
    .returning();

  return updated;
}
