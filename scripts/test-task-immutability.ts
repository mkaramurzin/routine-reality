// Test script to demonstrate task immutability feature
import { db } from "../lib/db";
import { routines, activeTasks } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveTasksWithStageInfo } from "../lib/queries/getActiveTasksWithStageInfo";
import { isTaskImmutable } from "../lib/routines/taskImmutability";

async function testTaskImmutability() {
  console.log("🔒 Testing Task Immutability Feature\n");

  try {
    // Get a routine with multiple stages
    const routine = await db.query.routines.findFirst({
      where: eq(routines.status, "active"),
      columns: {
        id: true,
        title: true,
        currentStage: true,
        stages: true,
      },
    });

    if (!routine) {
      console.log("❌ No active routines found");
      return;
    }

    console.log(`📋 Testing with routine: "${routine.title}"`);
    console.log(`🎯 Current stage: ${routine.currentStage} of ${routine.stages}`);
    console.log(`📊 Routine ID: ${routine.id}\n`);

    // Find a user with this routine
    const firstActiveTask = await db.query.activeTasks.findFirst({
      where: eq(activeTasks.routineId, routine.id),
      with: {
        user: {
          columns: { clerkUserId: true }
        }
      }
    });

    if (!firstActiveTask?.user?.clerkUserId) {
      console.log("❌ No user found for this routine");
      return;
    }

    const clerkUserId = firstActiveTask.user.clerkUserId;
    console.log(`👤 Testing with user: ${clerkUserId}\n`);

    // Get tasks with stage info
    const tasksWithStageInfo = await getActiveTasksWithStageInfo(clerkUserId, routine.id);
    
    console.log(`📝 Found ${tasksWithStageInfo.length} tasks with stage information:\n`);

    let mutableCount = 0;
    let immutableCount = 0;

    for (const task of tasksWithStageInfo) {
      const statusIcon = task.isImmutable ? "🔒" : "✅";
      const statusText = task.isImmutable ? "IMMUTABLE" : "MUTABLE";
      
      console.log(`${statusIcon} "${task.title}"`);
      console.log(`   📍 Stage: ${task.stageNumber || "unknown"}`);
      console.log(`   🔐 Status: ${statusText}`);
      console.log(`   📄 Task Status: ${task.status}`);
      
      // Test the immutability check function
      const immutableCheck = await isTaskImmutable(task.id, "active", routine.id);
      const checkIcon = immutableCheck === task.isImmutable ? "✅" : "❌";
      console.log(`   ${checkIcon} Immutability check: ${immutableCheck ? "LOCKED" : "UNLOCKED"}\n`);

      if (task.isImmutable) {
        immutableCount++;
      } else {
        mutableCount++;
      }
    }

    console.log("📊 Summary:");
    console.log(`   ✅ Mutable tasks: ${mutableCount}`);
    console.log(`   🔒 Immutable tasks: ${immutableCount}`);
    console.log(`   📈 Current stage: ${routine.currentStage}`);
    
    if (immutableCount > 0) {
      console.log("\n🎉 Task immutability is working! Tasks from previous stages are locked.");
    } else if (routine.currentStage === 1) {
      console.log("\n💡 No immutable tasks found - this is expected for stage 1.");
    } else {
      console.log("\n⚠️  No immutable tasks found - this might indicate an issue.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing task immutability:", error);
    process.exit(1);
  }
}

testTaskImmutability(); 