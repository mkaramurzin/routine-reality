import { db } from "@/lib/db";
import { routines, users, activeTasks, tasks, taskSets } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Updates routine progress when a task status changes
 * @param clerkUserId - The Clerk user ID
 * @param routineId - The routine ID to update
 * @param progressChange - The change in progress (+1 for completion, -1 for undo)
 * @param activeTaskId - The active task ID to validate stage matching
 * @returns The updated routine or null if not found
 */
export async function updateRoutineProgress(
  clerkUserId: string,
  routineId: string,
  progressChange: number,
  activeTaskId?: string
) {
  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) return null;

  // Get the current routine for validation
  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: {
      id: true,
      currentStage: true,
      currentStageProgress: true,
      stages: true,
      thresholds: true,
      status: true,
    },
  });

  if (!routine || routine.status !== "active") return null;

  // If we have an activeTaskId, validate that the task belongs to the current stage
  if (activeTaskId) {
    const activeTask = await db.query.activeTasks.findFirst({
      where: eq(activeTasks.id, activeTaskId),
      columns: { originalTaskId: true },
    });

    if (activeTask?.originalTaskId) {
      // Get the original task and its taskSet to check the stage
      const originalTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, activeTask.originalTaskId),
        columns: { taskSetId: true },
      });

      if (originalTask) {
        const taskSet = await db.query.taskSets.findFirst({
          where: eq(taskSets.id, originalTask.taskSetId),
          columns: { stageNumber: true },
        });

        // Only update progress if the task belongs to the current stage
        if (!taskSet || taskSet.stageNumber !== routine.currentStage) {
          console.log(`Task from stage ${taskSet?.stageNumber} does not match current routine stage ${routine.currentStage}, skipping progress update`);
          return routine; // Return routine without updating progress
        }
      }
    }
  }

  // Use atomic SQL increment operation to prevent race conditions
  const [updatedRoutine] = await db
    .update(routines)
    .set({
      currentStageProgress: sql`GREATEST(0, ${routines.currentStageProgress} + ${progressChange})`,
      updatedAt: new Date(),
    })
    .where(and(eq(routines.id, routineId), eq(routines.userId, user.id)))
    .returning();

  return updatedRoutine;
}

/**
 * Checks if a routine is eligible for stage advancement
 * @param clerkUserId - The Clerk user ID
 * @param routineId - The routine ID to check
 * @returns Object with eligibility status and current progress info
 */
export async function checkStageAdvancementEligibility(
  clerkUserId: string,
  routineId: string
) {
  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) return null;

  // Get the current routine
  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: {
      id: true,
      currentStage: true,
      currentStageProgress: true,
      stages: true,
      thresholds: true,
      status: true,
    },
  });

  if (!routine) return null;

  // Check if routine is active
  if (routine.status !== "active") {
    return {
      canAdvance: false,
      reason: `Routine is ${routine.status}`,
      currentProgress: routine.currentStageProgress,
      requiredProgress: 0,
      isOnFinalStage: false,
    };
  }

  // Check if on final stage
  const isOnFinalStage = routine.currentStage === routine.stages;

  // Get the threshold for current stage (stages are 1-indexed, arrays are 0-indexed)
  const currentThreshold = routine.thresholds[routine.currentStage - 1] || 0;

  // Check if progress meets threshold
  const canAdvance = routine.currentStageProgress >= currentThreshold;

  return {
    canAdvance,
    reason: canAdvance 
      ? "Ready to advance" 
      : `Need ${currentThreshold - routine.currentStageProgress} more completed tasks`,
    currentProgress: routine.currentStageProgress,
    requiredProgress: currentThreshold,
    isOnFinalStage,
  };
} 