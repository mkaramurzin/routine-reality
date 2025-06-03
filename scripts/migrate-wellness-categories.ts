import "dotenv/config";
import { db } from "@/lib/db";
import { routines, tasks, activeTasks, taskHistory, unmarkedTasks } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

type WellnessCategory = "overall_health" | "brainy" | "body" | "money" | "personal_growth" | "body_maintenance" | "custom";

/**
 * Migration script to add default wellness categories to existing data
 * This should be run after the database schema migration is complete
 */
async function migrateWellnessCategories() {
  console.log("🚀 Starting wellness categories migration...");

  try {
    // Step 1: Update existing routines with default wellness categories based on routine type
    console.log("📊 Updating existing routines...");
    
    // Get all routines that don't have wellness categories
    const existingRoutines = await db.query.routines.findMany({
      where: (r) => eq(r.wellnessCategories, [])
    });

    console.log(`Found ${existingRoutines.length} routines to update`);

    for (const routine of existingRoutines) {
      let defaultCategories: WellnessCategory[] = [];
      
      // Assign default categories based on routine title
      if (routine.title.toLowerCase().includes("monk")) {
        defaultCategories = ["personal_growth", "brainy", "body_maintenance"];
      } else if (routine.title.toLowerCase().includes("morning")) {
        defaultCategories = ["body_maintenance", "personal_growth"];
      } else if (routine.title.toLowerCase().includes("health")) {
        defaultCategories = ["overall_health", "body", "body_maintenance"];
      } else if (routine.title.toLowerCase().includes("productivity")) {
        defaultCategories = ["brainy", "personal_growth", "money"];
      } else {
        // Default generic categories
        defaultCategories = ["personal_growth"];
      }

      await db.update(routines)
        .set({ wellnessCategories: defaultCategories })
        .where(eq(routines.id, routine.id));

      console.log(`✅ Updated routine "${routine.title}" with categories: ${defaultCategories.join(", ")}`);
    }

    // Step 2: Update existing tasks with default wellness categories based on task content
    console.log("📝 Updating existing tasks...");
    
    const existingTasks = await db.query.tasks.findMany({
      where: (t) => eq(t.wellnessCategories, [])
    });

    console.log(`Found ${existingTasks.length} tasks to update`);

    for (const task of existingTasks) {
      let defaultCategories: WellnessCategory[] = [];
      const title = task.title.toLowerCase();
      
      // Assign categories based on task content
      if (title.includes("meditat") || title.includes("mindful")) {
        defaultCategories = ["brainy", "personal_growth"];
      } else if (title.includes("exercise") || title.includes("workout") || title.includes("stretch")) {
        defaultCategories = ["body"];
      } else if (title.includes("water") || title.includes("hydrat")) {
        defaultCategories = ["overall_health"];
      } else if (title.includes("sleep") || title.includes("bed")) {
        defaultCategories = ["body_maintenance"];
      } else if (title.includes("plan") || title.includes("priorit") || title.includes("goal")) {
        defaultCategories = ["brainy", "personal_growth"];
      } else if (title.includes("work") || title.includes("focus")) {
        defaultCategories = ["brainy"];
      } else if (title.includes("read") || title.includes("learn")) {
        defaultCategories = ["brainy"];
      } else if (title.includes("call") || title.includes("family") || title.includes("grateful")) {
        defaultCategories = ["personal_growth"];
      } else {
        // Default category for unmatched tasks
        defaultCategories = ["personal_growth"];
      }

      await db.update(tasks)
        .set({ wellnessCategories: defaultCategories })
        .where(eq(tasks.id, task.id));

      console.log(`✅ Updated task "${task.title}" with categories: ${defaultCategories.join(", ")}`);
    }

    // Step 3: Update active tasks to inherit from their original tasks
    console.log("⚡ Updating active tasks...");
    
    const activeTasksToUpdate = await db.query.activeTasks.findMany({
      where: (at) => eq(at.wellnessCategories, []),
      with: {
        originalTask: true
      }
    });

    console.log(`Found ${activeTasksToUpdate.length} active tasks to update`);

    for (const activeTask of activeTasksToUpdate) {
      if (activeTask.originalTask && activeTask.originalTask.wellnessCategories) {
        await db.update(activeTasks)
          .set({ wellnessCategories: activeTask.originalTask.wellnessCategories })
          .where(eq(activeTasks.id, activeTask.id));

        console.log(`✅ Updated active task "${activeTask.title}" with inherited categories`);
      } else {
        // Fallback to generic category
        await db.update(activeTasks)
          .set({ wellnessCategories: ["personal_growth"] })
          .where(eq(activeTasks.id, activeTask.id));
      }
    }

    // Step 4: Update task history
    console.log("📚 Updating task history...");
    
    const historyToUpdate = await db.query.taskHistory.findMany({
      where: (th) => eq(th.wellnessCategories, []),
      with: {
        originalTask: true
      }
    });

    console.log(`Found ${historyToUpdate.length} history records to update`);

    for (const historyTask of historyToUpdate) {
      if (historyTask.originalTask && historyTask.originalTask.wellnessCategories) {
        await db.update(taskHistory)
          .set({ wellnessCategories: historyTask.originalTask.wellnessCategories })
          .where(eq(taskHistory.id, historyTask.id));
      } else {
        await db.update(taskHistory)
          .set({ wellnessCategories: ["personal_growth"] })
          .where(eq(taskHistory.id, historyTask.id));
      }
    }

    // Step 5: Update unmarked tasks
    console.log("📋 Updating unmarked tasks...");
    
    const unmarkedToUpdate = await db.query.unmarkedTasks.findMany({
      where: (ut) => eq(ut.wellnessCategories, []),
      with: {
        originalTask: true
      }
    });

    console.log(`Found ${unmarkedToUpdate.length} unmarked tasks to update`);

    for (const unmarkedTask of unmarkedToUpdate) {
      if (unmarkedTask.originalTask && unmarkedTask.originalTask.wellnessCategories) {
        await db.update(unmarkedTasks)
          .set({ wellnessCategories: unmarkedTask.originalTask.wellnessCategories })
          .where(eq(unmarkedTasks.id, unmarkedTask.id));
      } else {
        await db.update(unmarkedTasks)
          .set({ wellnessCategories: ["personal_growth"] })
          .where(eq(unmarkedTasks.id, unmarkedTask.id));
      }
    }

    console.log("✅ Wellness categories migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Execute the migration
migrateWellnessCategories()
  .then(() => {
    console.log("🎉 Migration script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  }); 