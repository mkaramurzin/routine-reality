import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { users, routines, activeTasks, unmarkedTasks, taskHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function closeOutDayForAllUsers() {
  // Get all users with active routines
  console.log("Starting closeOutDayForAllUsers...");

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

      const userNow = DateTime.now().setZone(userTimezone);

      // Only process if it is midnight in the user's timezone (hour === 0)
      if (userNow.hour !== 0) {
        console.log(
          `Skipping user ${user.id} because it is not midnight in their timezone (current time: ${userNow.toFormat("HH:mm")})`
        );
        continue;
      }

      const userYesterday = userNow.minus({ days: 1 });
      const userYesterdayStr = userYesterday.toFormat("yyyy-LL-dd");
      console.log(`User local time is ${userNow.toISO()}, so will process tasks scheduled for (local date): ${userYesterdayStr}`);

      // Get all active tasks for this user (could add range here)
      const userActiveTasks = await db.query.activeTasks.findMany({
        where: (a) => eq(a.userId, user.id),
      });
      console.log(`Found ${userActiveTasks.length} active tasks for user ${user.id}`);

      // Filter tasks whose scheduledFor local date matches YESTERDAY in user's timezone
      const tasksForYesterday = userActiveTasks.filter((task) => {
        if (!task.scheduledFor) {
          console.log(`Task ${task.id} has no scheduledFor. Skipping.`);
          return false;
        }
        const localScheduled = DateTime.fromJSDate(task.scheduledFor).setZone(userTimezone);
        const localDateStr = localScheduled.toFormat("yyyy-LL-dd");
        const match = localDateStr === userYesterdayStr;
        console.log(
          `Task ${task.id} scheduledFor (UTC): ${task.scheduledFor.toISOString()}, ` +
          `in user's TZ: ${localScheduled.toISO()} (date: ${localDateStr}) ` +
          `=> ${match ? "MATCH" : "NO MATCH"}`
        );
        return match;
      });

      console.log(`User ${user.id}: ${tasksForYesterday.length} tasks match yesterday (${userYesterdayStr})`);

      if (!tasksForYesterday.length) continue;

      // Partition by status
      const toUnmarked: typeof tasksForYesterday = [];
      const toHistory: typeof tasksForYesterday = [];

      for (const task of tasksForYesterday) {
        if (task.status === "todo") {
          toUnmarked.push(task);
        } else if (task.status === "completed" || task.status === "missed") {
          toHistory.push(task);
        } else {
          console.log(`Task ${task.id} has unknown status '${task.status}', skipping.`);
        }
      }

      console.log(
        `User ${user.id}: ${toUnmarked.length} to unmarked, ${toHistory.length} to history`
      );

      // Insert into unmarkedTasks, set activeTaskId to null to avoid FK violation
      for (const task of toUnmarked) {
        try {
          await db.insert(unmarkedTasks).values({
            userId: task.userId,
            routineId: task.routineId,
            originalTaskId: task.originalTaskId,
            activeTaskId: null, // No FK violation
            title: task.title,
            description: task.description,
            isOptional: task.isOptional,
            scheduledFor: task.scheduledFor,
            createdAt: new Date(),
          });
          console.log(`Inserted task ${task.id} into unmarkedTasks`);
        } catch (err) {
          console.error(`Failed to insert task ${task.id} into unmarkedTasks:`, err);
        }
      }

      // Insert into taskHistory, set activeTaskId to null to avoid FK violation
      for (const task of toHistory) {
        try {
          const status: "completed" | "missed" = task.status === "completed" ? "completed" : "missed";
          await db.insert(taskHistory).values({
            userId: task.userId,
            routineId: task.routineId,
            originalTaskId: task.originalTaskId,
            activeTaskId: null, // No FK violation
            title: task.title,
            description: task.description,
            isOptional: task.isOptional,
            status,
            scheduledFor: task.scheduledFor,
            completedAt: task.completedAt ?? null,
            missedAt: task.missedAt ?? null,
            createdAt: new Date(),
          });
          console.log(`Inserted task ${task.id} into taskHistory`);
        } catch (err) {
          console.error(`Failed to insert task ${task.id} into taskHistory:`, err);
        }
      }

      // Delete each processed activeTask
      for (const task of tasksForYesterday) {
        try {
          await db.delete(activeTasks).where(eq(activeTasks.id, task.id));
          console.log(`Deleted activeTask ${task.id}`);
        } catch (deleteError) {
          console.error(`Failed to delete activeTask ${task.id}:`, deleteError);
        }
      }
      console.log(`Finished processing user ${user.id}`);
    } catch (userError) {
      console.error(`Error processing user ${user.id}:`, userError);
    }
  }
  console.log("closeOutDayForAllUsers completed.");
}