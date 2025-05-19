import { db } from "@/lib/db";
import { activeTasks, routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface UpdateActiveTaskData {
  status?: "todo" | "in_progress" | "completed" | "missed";
  completedAt?: Date | null;
  missedAt?: Date | null;
}

export async function updateActiveTaskById(
  clerkUserId: string,
  taskId: string,
  data: UpdateActiveTaskData
) {
  const task = await db.query.activeTasks.findFirst({
    where: eq(activeTasks.id, taskId),
    columns: { routineId: true, userId: true },
  });

  if (!task) return null;

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, task.routineId),
    columns: { userId: true },
  });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!routine || !user || routine.userId !== user.id || task.userId !== user.id) return null;

  const [updated] = await db
    .update(activeTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(activeTasks.id, taskId))
    .returning();

  return updated;
}
