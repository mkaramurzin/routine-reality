import "dotenv/config";
import { db } from "@/lib/db";
import { 
  users, 
  routines, 
  taskSets, 
  tasks, 
  activeTasks, 
  taskHistory, 
  unmarkedTasks 
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Delete a user and all associated data
 * 
 * This script removes a user and all their associated data from the database:
 * - Unmarked tasks
 * - Task history
 * - Active tasks
 * - Tasks (templates)
 * - Task sets
 * - Routines
 * - User record
 * 
 * @param userId The UUID of the user to delete
 */
async function deleteUser(userId: string) {
  console.log(`Starting deletion process for user ${userId}...`);
  
  try {
    // First, find the user to ensure they exist
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      return;
    }

    console.log(`Found user: ${user.id} (Clerk ID: ${user.clerkUserId})`);
    
    // Step 1: Get all routines for this user
    const userRoutines = await db.query.routines.findMany({
      where: eq(routines.userId, userId),
    });
    
    const routineIds = userRoutines.map(routine => routine.id);
    console.log(`Found ${routineIds.length} routines to delete`);
    
    // Step 2: Delete unmarked tasks
    const deletedUnmarkedTasks = await db
      .delete(unmarkedTasks)
      .where(eq(unmarkedTasks.userId, userId))
      .returning();
    
    console.log(`✅ Deleted ${deletedUnmarkedTasks.length} unmarked tasks`);
    
    // Step 3: Delete task history
    const deletedTaskHistory = await db
      .delete(taskHistory)
      .where(eq(taskHistory.userId, userId))
      .returning();
    
    console.log(`✅ Deleted ${deletedTaskHistory.length} task history records`);
    
    // Step 4: Delete active tasks
    const deletedActiveTasks = await db
      .delete(activeTasks)
      .where(eq(activeTasks.userId, userId))
      .returning();
    
    console.log(`✅ Deleted ${deletedActiveTasks.length} active tasks`);
    
    // Step 5: For each routine, delete its task sets and tasks
    for (const routineId of routineIds) {
      // Get all task sets for this routine
      const routineTaskSets = await db.query.taskSets.findMany({
        where: eq(taskSets.routineId, routineId),
      });
      
      // For each task set, delete its tasks
      for (const taskSet of routineTaskSets) {
        const deletedTasks = await db
          .delete(tasks)
          .where(eq(tasks.taskSetId, taskSet.id))
          .returning();
        
        console.log(`✅ Deleted ${deletedTasks.length} tasks from task set ${taskSet.id}`);
      }
      
      // Delete all task sets for this routine
      const deletedTaskSets = await db
        .delete(taskSets)
        .where(eq(taskSets.routineId, routineId))
        .returning();
      
      console.log(`✅ Deleted ${deletedTaskSets.length} task sets from routine ${routineId}`);
    }
    
    // Step 6: Delete all routines
    const deletedRoutines = await db
      .delete(routines)
      .where(eq(routines.userId, userId))
      .returning();
    
    console.log(`✅ Deleted ${deletedRoutines.length} routines`);
    
    // Step 7: Finally delete the user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`✅ Successfully deleted user ${userId}`);
    
    return {
      success: true,
      deletedUser: deletedUser[0],
      stats: {
        routines: deletedRoutines.length,
        activeTasks: deletedActiveTasks.length,
        taskHistory: deletedTaskHistory.length,
        unmarkedTasks: deletedUnmarkedTasks.length,
      }
    };
  } catch (error) {
    console.error("❌ Error during user deletion:", error);
    return {
      success: false,
      error
    };
  }
}

// Check if this script was executed directly
if (require.main === module) {
  // Get the user ID from command line arguments
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("❌ Error: User ID is required");
    console.log("Usage: ts-node scripts/delete-user.ts USER_ID");
    process.exit(1);
  }
  
  // Execute the function
  deleteUser(userId)
    .then((result) => {
      if (result?.success) {
        console.log("✅ Script completed successfully!");
      } else {
        console.error("❌ Script failed");
      }
      process.exit(result?.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Script failed with an unhandled error:", error);
      process.exit(1);
    });
} 