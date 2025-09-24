import { db } from "@/lib/db";
import { taskHistory, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RoutineTimeline } from "@/lib/routines/timeline";

type TaskHistoryEntry = typeof taskHistory.$inferSelect;

type StageProgressionMetadata = {
  stageProgression?: boolean;
  stageNumber?: number;
  stageAdvancedAt?: string;
};

type TaskHistoryResponse = Array<TaskHistoryEntry & StageProgressionMetadata>;

function createStageAdvanceTask(
  routineId: string,
  userId: string,
  stageNumber: number,
  eventDate: string
): TaskHistoryEntry & StageProgressionMetadata {
  const date = new Date(eventDate);

  return {
    id: `stage-advance-${routineId}-${stageNumber}-${date.getTime()}`,
    userId,
    routineId,
    originalTaskId: null,
    activeTaskId: null,
    title: `Advanced to Stage ${stageNumber}`,
    description: null,
    wellnessCategories: [],
    isOptional: true,
    status: "completed",
    scheduledFor: date,
    completedAt: date,
    missedAt: null,
    createdAt: date,
    stageProgression: true,
    stageNumber,
    stageAdvancedAt: eventDate,
  };
}

export async function getTaskHistory(
  clerkUserId: string,
  routineId: string
): Promise<TaskHistoryResponse> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: { id: true, timeline: true },
  });

  if (!routine) throw new Error("Routine not found");

  const historyTasks = await db.query.taskHistory.findMany({
    where: and(eq(taskHistory.userId, user.id), eq(taskHistory.routineId, routineId)),
  });

  const timeline = (routine.timeline as RoutineTimeline) || [];
  const stageAdvanceTasks = timeline
    .filter(event => event.type === "stage_advanced" && typeof event.stageNumber === "number")
    .map(event =>
      createStageAdvanceTask(
        routineId,
        user.id,
        event.stageNumber as number,
        event.date
      )
    );

  const baseHistoryTasks: TaskHistoryResponse = historyTasks.map(task => ({ ...task }));

  return [...baseHistoryTasks, ...stageAdvanceTasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
