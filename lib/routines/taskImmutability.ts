// Task immutability utilities for stage-based locking

import { db } from "@/lib/db";
import { routines, tasks, taskSets, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if a task is immutable based on its stage vs current routine stage
 * Tasks become immutable once the user has advanced past their stage
 */
export async function isTaskImmutable(
  taskId: string,
  taskType: "active" | "history" | "unmarked",
  routineId?: string
): Promise<boolean> {
  try {
    let originalTaskId: string | null = null;
    let currentRoutineId = routineId;

    // Get the original task ID and routine ID based on task type
    if (taskType === "active") {
      const activeTask = await db.query.activeTasks.findFirst({
        where: eq(activeTasks.id, taskId),
        columns: { originalTaskId: true, routineId: true },
      });
      originalTaskId = activeTask?.originalTaskId || null;
      currentRoutineId = activeTask?.routineId || routineId;
    } else {
      // For history and unmarked tasks, they should have originalTaskId directly
      // We'll need to query those tables when we implement them
      return false; // For now, return false for non-active tasks
    }

    if (!originalTaskId || !currentRoutineId) {
      return false;
    }

    // Get the task's stage number
    const originalTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, originalTaskId),
      columns: { taskSetId: true },
    });

    if (!originalTask) {
      return false;
    }

    const taskSet = await db.query.taskSets.findFirst({
      where: eq(taskSets.id, originalTask.taskSetId),
      columns: { stageNumber: true },
    });

    if (!taskSet) {
      return false;
    }

    // Get the routine's current stage
    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, currentRoutineId),
      columns: { currentStage: true },
    });

    if (!routine) {
      return false;
    }

    // Task is immutable if its stage is less than the current routine stage
    return taskSet.stageNumber < routine.currentStage;
  } catch (error) {
    console.error("Error checking task immutability:", error);
    return false;
  }
}

/**
 * Check if all tasks from previous stages in a routine will become immutable
 * Used for confirmation dialogs
 */
export async function getTaskImmutabilityInfo(
  routineId: string,
  newStage: number
): Promise<{
  tasksWillBecomeImmutable: number;
  stagesAffected: number[];
}> {
  try {
    // Get all active tasks for this routine
    const allActiveTasks = await db.query.activeTasks.findMany({
      where: eq(activeTasks.routineId, routineId),
      columns: { originalTaskId: true },
    });

    let tasksWillBecomeImmutable = 0;
    const stagesAffected = new Set<number>();

    for (const activeTask of allActiveTasks) {
      if (activeTask.originalTaskId) {
        const originalTask = await db.query.tasks.findFirst({
          where: eq(tasks.id, activeTask.originalTaskId),
          columns: { taskSetId: true },
        });

        if (originalTask) {
          const taskSet = await db.query.taskSets.findFirst({
            where: eq(taskSets.id, originalTask.taskSetId),
            columns: { stageNumber: true },
          });

          // If task's stage is less than the new stage, it will become immutable
          if (taskSet && taskSet.stageNumber < newStage) {
            tasksWillBecomeImmutable++;
            stagesAffected.add(taskSet.stageNumber);
          }
        }
      }
    }

    return {
      tasksWillBecomeImmutable,
      stagesAffected: Array.from(stagesAffected).sort(),
    };
  } catch (error) {
    console.error("Error getting task immutability info:", error);
    return {
      tasksWillBecomeImmutable: 0,
      stagesAffected: [],
    };
  }
}

/**
 * Get immutable tasks for a routine (for UI display)
 */
export async function getImmutableTasksForRoutine(routineId: string) {
  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
    columns: { currentStage: true },
  });

  if (!routine) {
    return [];
  }

  const allActiveTasks = await db.query.activeTasks.findMany({
    where: eq(activeTasks.routineId, routineId),
  });

  const immutableTasks = [];

  for (const activeTask of allActiveTasks) {
    if (activeTask.originalTaskId) {
      const originalTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, activeTask.originalTaskId),
        columns: { taskSetId: true },
      });

      if (originalTask) {
        const taskSet = await db.query.taskSets.findFirst({
          where: eq(taskSets.id, originalTask.taskSetId),
          columns: { stageNumber: true },
        });

        if (taskSet && taskSet.stageNumber < routine.currentStage) {
          immutableTasks.push({
            ...activeTask,
            stageNumber: taskSet.stageNumber,
            isImmutable: true,
          });
        }
      }
    }
  }

  return immutableTasks;
} 