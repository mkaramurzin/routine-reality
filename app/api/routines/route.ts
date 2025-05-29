import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createRoutine } from "@/lib/queries/createRoutine";
import { getUserRoutines } from "@/lib/queries/getUserRoutines";
import { db } from "@/lib/db";
import { users, activeTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { DateTime } from "luxon";

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const routines = await getUserRoutines(clerkUserId);

    // Get user timezone for today's tasks calculation
    const user = await db.query.users.findFirst({
      where: (u) => eq(u.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate today's date in user's timezone
    let userTimezone = user.timezone || 'UTC';
    if (!DateTime.now().setZone(userTimezone).isValid) {
      userTimezone = 'UTC';
    }
    const userNow = DateTime.now().setZone(userTimezone);
    const userTodayStr = userNow.toFormat("yyyy-LL-dd");

    // Enhance routines with today's task information
    const enhancedRoutines = await Promise.all(
      routines.map(async (routine) => {
        // Get active tasks for this routine
        const routineTasks = await db.query.activeTasks.findMany({
          where: (a) => and(
            eq(a.userId, user.id),
            eq(a.routineId, routine.id)
          ),
        });

        // Filter tasks scheduled for today
        const todayTasks = routineTasks.filter((task) => {
          if (!task.scheduledFor) return false;
          const localScheduled = DateTime.fromJSDate(task.scheduledFor).setZone(userTimezone);
          const localDateStr = localScheduled.toFormat("yyyy-LL-dd");
          return localDateStr === userTodayStr;
        });

        return {
          ...routine,
          todayTaskCount: todayTasks.length,
          hasTasksToday: todayTasks.length > 0
        };
      })
    );

    return NextResponse.json(enhancedRoutines);
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json({ error: "Failed to fetch routines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, routineInfo, routineType, startDate, endDate, stages, thresholds } = body;

  // Basic validation
  if (
    !title ||
    !routineInfo ||
    !routineType ||
    !startDate ||
    !endDate ||
    !stages ||
    !Array.isArray(thresholds)
  ) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  try {
    const routine = await createRoutine(clerkUserId, {
      title,
      routineInfo,
      routineType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      stages,
      thresholds,
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
