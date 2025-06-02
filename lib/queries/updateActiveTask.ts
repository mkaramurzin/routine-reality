import { db } from "@/lib/db";
import { activeTasks, routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateRoutineProgress } from "./updateRoutineProgress";

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
  // First, get the current task to check its current status
  const currentTask = await db.query.activeTasks.findFirst({
    where: eq(activeTasks.id, taskId),
    columns: { 
      routineId: true, 
      userId: true, 
      status: true,
      isOptional: true 
    },
  });

  if (!currentTask) return null;

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, currentTask.routineId),
    columns: { userId: true },
  });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!routine || !user || routine.userId !== user.id || currentTask.userId !== user.id) return null;

  // Update the task
  const [updated] = await db
    .update(activeTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(activeTasks.id, taskId))
    .returning();

  // Track routine progress changes (only for non-optional tasks)
  if (!currentTask.isOptional && data.status) {
    const oldStatus = currentTask.status;
    const newStatus = data.status;
    
    let progressChange = 0;
    
    // Calculate progress change based on status transition
    if (oldStatus !== "completed" && newStatus === "completed") {
      // Task was completed
      progressChange = +1;
    } else if (oldStatus === "completed" && newStatus !== "completed") {
      // Task was uncompleted (undo)
      progressChange = -1;
    }
    
    // Update routine progress if there's a change
    if (progressChange !== 0) {
      await updateRoutineProgress(clerkUserId, currentTask.routineId, progressChange, taskId);
    }
  }

  return updated;
}
