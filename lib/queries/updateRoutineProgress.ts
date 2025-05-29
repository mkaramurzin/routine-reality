import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Updates routine progress when a task status changes
 * @param clerkUserId - The Clerk user ID
 * @param routineId - The routine ID to update
 * @param progressChange - The change in progress (+1 for completion, -1 for undo)
 * @returns The updated routine or null if not found
 */
export async function updateRoutineProgress(
  clerkUserId: string,
  routineId: string,
  progressChange: number
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

  if (!routine || routine.status !== "active") return null;

  // Calculate new progress, ensuring it doesn't go below 0
  const newProgress = Math.max(0, routine.currentStageProgress + progressChange);

  // Update the routine with new progress
  const [updatedRoutine] = await db
    .update(routines)
    .set({
      currentStageProgress: newProgress,
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