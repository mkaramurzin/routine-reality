import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { users, activeTasks, taskHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const routineId = resolvedParams.id;

  try {
    // Get the user to access their timezone
    const user = await db.query.users.findFirst({
      where: (u) => eq(u.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure timezone is valid, fallback to UTC if not
    let userTimezone = user.timezone || 'UTC';
    if (!DateTime.now().setZone(userTimezone).isValid) {
      console.warn(`Invalid timezone for user ${user.id}: ${userTimezone}, falling back to UTC`);
      userTimezone = 'UTC';
    }

    // Get current day in user's timezone
    const userNow = DateTime.now().setZone(userTimezone);
    const userTodayStr = userNow.toFormat("yyyy-LL-dd");

    // Get all active tasks for this routine scheduled for today
    const tasksToSkip = await db.query.activeTasks.findMany({
      where: (a) => and(
        eq(a.userId, user.id),
        eq(a.routineId, routineId)
      ),
    });

    // Filter tasks scheduled for today in user's timezone
    const todayTasks = tasksToSkip.filter((task) => {
      if (!task.scheduledFor) return false;
      
      const localScheduled = DateTime.fromJSDate(task.scheduledFor).setZone(userTimezone);
      const localDateStr = localScheduled.toFormat("yyyy-LL-dd");
      return localDateStr === userTodayStr;
    });

    if (todayTasks.length === 0) {
      return NextResponse.json({ 
        message: "No tasks found for today", 
        skippedCount: 0 
      });
    }

    // Move each task to taskHistory with "skipped" status
    for (const task of todayTasks) {
      try {
        // Insert into taskHistory
        await db.insert(taskHistory).values({
          userId: task.userId,
          routineId: task.routineId,
          originalTaskId: task.originalTaskId,
          activeTaskId: null, // Avoid FK violation as per existing pattern
          title: task.title,
          description: task.description,
          isOptional: task.isOptional,
          status: "skipped",
          scheduledFor: task.scheduledFor,
          completedAt: null,
          missedAt: null,
          createdAt: new Date(),
        });

        // Delete from activeTasks
        await db.delete(activeTasks).where(eq(activeTasks.id, task.id));
        
        console.log(`Skipped task ${task.id} for routine ${routineId}`);
      } catch (err) {
        console.error(`Failed to skip task ${task.id}:`, err);
        throw err;
      }
    }

    return NextResponse.json({
      message: "Routine skipped successfully",
      skippedCount: todayTasks.length,
    });

  } catch (error) {
    console.error("Error skipping routine:", error);
    return NextResponse.json(
      { error: "Failed to skip routine" },
      { status: 500 }
    );
  }
} 