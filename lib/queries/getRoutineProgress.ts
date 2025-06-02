import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Gets detailed progress information for a routine
 * @param clerkUserId - The Clerk user ID
 * @param routineId - The routine ID
 * @returns Detailed progress information or null if not found
 */
export async function getRoutineProgress(clerkUserId: string, routineId: string) {
  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) return null;

  // Get the routine with progress information
  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, routineId), eq(routines.userId, user.id)),
    columns: {
      id: true,
      title: true,
      currentStage: true,
      currentStageProgress: true,
      stages: true,
      thresholds: true,
      status: true,
    },
  });

  if (!routine) return null;

  // Calculate progress information
  const isOnFinalStage = routine.currentStage === routine.stages;
  const currentThreshold = routine.thresholds[routine.currentStage - 1] || 0;
  const canAdvance = routine.currentStageProgress >= currentThreshold && routine.status === "active";
  const overallProgress = (routine.currentStage / routine.stages) * 100;
  const stageProgress = currentThreshold > 0 ? (routine.currentStageProgress / currentThreshold) * 100 : 0;

  return {
    id: routine.id,
    title: routine.title,
    currentStage: routine.currentStage,
    totalStages: routine.stages,
    currentStageProgress: routine.currentStageProgress,
    currentStageThreshold: currentThreshold,
    canAdvance,
    isOnFinalStage,
    status: routine.status,
    overallProgressPercentage: Math.min(100, overallProgress),
    stageProgressPercentage: Math.min(100, stageProgress),
    tasksNeededToAdvance: Math.max(0, currentThreshold - routine.currentStageProgress),
  };
} 