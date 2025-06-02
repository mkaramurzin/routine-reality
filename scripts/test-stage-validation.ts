// Test script to demonstrate stage validation logic
import { db } from "../lib/db";
import { routines, activeTasks, tasks, taskSets } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testStageValidation() {
  console.log("🧪 Testing Stage Validation Logic\n");

  try {
    // Get a routine with active tasks
    const routine = await db.query.routines.findFirst({
      where: eq(routines.status, "active"),
      columns: {
        id: true,
        title: true,
        currentStage: true,
        currentStageProgress: true,
      },
    });

    if (!routine) {
      console.log("❌ No active routines found");
      return;
    }

    console.log(`📋 Testing with routine: "${routine.title}"`);
    console.log(`🎯 Current stage: ${routine.currentStage}`);
    console.log(`📊 Current progress: ${routine.currentStageProgress}\n`);

    // Get active tasks for this routine
    const activeTasksForRoutine = await db.query.activeTasks.findMany({
      where: eq(activeTasks.routineId, routine.id),
      columns: {
        id: true,
        title: true,
        originalTaskId: true,
        status: true,
      },
    });

    console.log(`📝 Found ${activeTasksForRoutine.length} active tasks:\n`);

    // Check each task's stage
    for (const activeTask of activeTasksForRoutine) {
      if (activeTask.originalTaskId) {
        // Get the original task
        const originalTask = await db.query.tasks.findFirst({
          where: eq(tasks.id, activeTask.originalTaskId),
          columns: { taskSetId: true },
        });

        if (originalTask) {
          // Get the taskSet to check stage
          const taskSet = await db.query.taskSets.findFirst({
            where: eq(taskSets.id, originalTask.taskSetId),
            columns: { stageNumber: true, title: true },
          });

          const stageMatch = taskSet?.stageNumber === routine.currentStage;
          const statusIcon = stageMatch ? "✅" : "❌";
          const willContribute = stageMatch ? "WILL contribute" : "will NOT contribute";

          console.log(`${statusIcon} "${activeTask.title}"`);
          console.log(`   📍 Task from stage: ${taskSet?.stageNumber || "unknown"}`);
          console.log(`   📈 Completion ${willContribute} to progress`);
          console.log(`   📄 Status: ${activeTask.status}\n`);
        }
      }
    }

    console.log("🎉 Stage validation test completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing stage validation:", error);
    process.exit(1);
  }
}

testStageValidation(); 