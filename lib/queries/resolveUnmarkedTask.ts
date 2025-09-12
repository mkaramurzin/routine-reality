import { db } from "@/lib/db";
import { unmarkedTasks, taskHistory, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateRoutineProgress } from "./updateRoutineProgress";

interface ResolveUnmarkedTaskData {
  status: "completed" | "missed";
  completedAt?: Date | null;
  missedAt?: Date | null;
}

export async function resolveUnmarkedTaskById(
  clerkUserId: string,
  taskId: string,
  data: ResolveUnmarkedTaskData
) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) return null;

  const task = await db.query.unmarkedTasks.findFirst({
    where: eq(unmarkedTasks.id, taskId),
  });

  if (!task || task.userId !== user.id) return null;

  const status = data.status;
  const completedAt = status === "completed" ? data.completedAt ?? new Date() : null;
  const missedAt = status === "missed" ? data.missedAt ?? new Date() : null;

  const [history] = await db
    .insert(taskHistory)
    .values({
      userId: task.userId,
      routineId: task.routineId,
      originalTaskId: task.originalTaskId,
      activeTaskId: task.activeTaskId,
      title: task.title,
      description: task.description,
      wellnessCategories: task.wellnessCategories,
      isOptional: task.isOptional,
      status,
      scheduledFor: task.scheduledFor,
      completedAt,
      missedAt,
      createdAt: new Date(),
    })
    .returning();

  await db.delete(unmarkedTasks).where(eq(unmarkedTasks.id, taskId));

  if (!task.isOptional && status === "completed" && task.routineId) {
    await updateRoutineProgress(clerkUserId, task.routineId, 1);
  }

  return history;
}
