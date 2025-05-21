import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { users, routines, taskSets, tasks, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Main function
export async function serveTasksForAllUsers() {
  console.log("Starting serveTasksForAllUsers...");
  
  const allUsers = await db.select().from(users);
  console.log(`Fetched ${allUsers.length} users.`);

  for (const user of allUsers) {
    try {
      console.log(`\nProcessing user: ${user.id} (${user.timezone})`);
      
      // Ensure timezone is valid, fallback to UTC if not
      let userTimezone = user.timezone || 'UTC';
      
      if (!DateTime.now().setZone(userTimezone).isValid) {
        console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
        userTimezone = 'UTC';
      }
      
      const nowUser = DateTime.now().setZone(userTimezone);
      console.log(`User local time is ${nowUser.toISO()}`);
      
      // Check if it's 5:00 AM in the user's timezone (allow small window)
      const isMorningTaskTime = nowUser.hour === 5 && nowUser.minute < 15;
      console.log(`Is 5:00 AM task time for user? ${isMorningTaskTime} (Hour: ${nowUser.hour}, Minute: ${nowUser.minute})`);
      
      // Only proceed if it's the morning task time
      if (isMorningTaskTime) {
        console.log(`It's morning task time for user ${user.id}, continuing to serve tasks`);
        
        // All active routines for user
        const userRoutines = await db.query.routines.findMany({
          where: (r) => and(eq(r.userId, user.id), eq(r.status, "active")),
        });
        console.log(`Found ${userRoutines.length} active routines for user ${user.id}`);

        for (const routine of userRoutines) {
          console.log(`Processing routine ${routine.id} (${routine.title}), current stage: ${routine.currentStage}`);
          const currentStage = routine.currentStage;

          // All task sets for current stage
          const taskSetsForStage = await db.query.taskSets.findMany({
            where: (ts) => and(
              eq(ts.routineId, routine.id),
              eq(ts.stageNumber, currentStage)
            ),
          });
          console.log(`Found ${taskSetsForStage.length} task sets for routine ${routine.id} at stage ${currentStage}`);

          for (const set of taskSetsForStage) {
            console.log(`Processing task set ${set.id} (${set.title})`);
            
            // All template tasks for this set
            const templateTasks = await db.query.tasks.findMany({
              where: (t) => eq(t.taskSetId, set.id),
            });
            console.log(`Found ${templateTasks.length} template tasks for task set ${set.id}`);

            // Set scheduled time to 5:00 AM in user's timezone
            const scheduledTime = nowUser.set({
              hour: 5,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            
            console.log(`Setting scheduled time to 5:00 AM: ${scheduledTime.toISO()}`);

            // Schedule time in UTC for DB consistency
            const scheduledForUtc = scheduledTime.toUTC().toJSDate();
            console.log(`Converted to UTC for DB storage: ${scheduledForUtc.toISOString()}`);

            for (const task of templateTasks) {
              console.log(`Processing template task ${task.id} (${task.title})`);
              
              // Check for existing activeTask (idempotency)
              const existing = await db.query.activeTasks.findFirst({
                where: (a) =>
                  and(
                    eq(a.userId, user.id),
                    eq(a.originalTaskId, task.id),
                    eq(a.scheduledFor, scheduledForUtc)
                  ),
              });

              if (existing) {
                console.log(`Task ${task.id} already has an active task for today, skipping`);
              } else {
                console.log(`Creating new active task from template task ${task.id}`);
                try {
                  await db.insert(activeTasks).values({
                    userId: user.id,
                    routineId: routine.id,
                    originalTaskId: task.id,
                    title: task.title,
                    description: task.description,
                    isOptional: task.isOptional,
                    order: task.order,
                    status: "todo",
                    scheduledFor: scheduledForUtc,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                  console.log(`Successfully created active task from template ${task.id}`);
                } catch (err) {
                  console.error(`Failed to create active task from template ${task.id}:`, err);
                }
              }
            }
          }
        }
      } else {
        console.log(`Not morning task time for user ${user.id}, skipping task creation`);
      }
      console.log(`Finished processing user ${user.id}`);
    } catch (userError) {
      console.error(`Error processing user ${user.id}:`, userError);
    }
  }
  console.log("serveTasksForAllUsers completed.");
}