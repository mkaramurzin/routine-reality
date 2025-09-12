import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getActiveTasksForToday } from "@/lib/queries/getActiveTasks";
import { getActiveTasksWithStageInfo } from "@/lib/queries/getActiveTasksWithStageInfo";
import { getUnmarkedTasks } from "@/lib/queries/getUnmarkedTasks";
import { getTaskHistory } from "@/lib/queries/getTaskHistory";
import { createActiveTask } from "@/lib/queries/createActiveTask";
import { getUserRoutines } from "@/lib/queries/getUserRoutines";
import { getUpcomingTasks } from "@/lib/queries/getUpcomingTasks";

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const routineId = url.searchParams.get("routineId");
  const includeStageInfo = url.searchParams.get("includeStageInfo") === "true";

  if (!type) {
    return NextResponse.json({ error: "Missing type parameter." }, { status: 400 });
  }

  try {
    if (type === "active") {
      if (includeStageInfo) {
        // Use enhanced query that includes stage info and immutability status
        const tasks = await getActiveTasksWithStageInfo(clerkUserId, routineId || undefined);
        return NextResponse.json(tasks);
      } else if (routineId) {
        // Get tasks for specific routine (legacy)
        const tasks = await getActiveTasksForToday(clerkUserId, routineId);
        return NextResponse.json(tasks);
      } else {
        // Get tasks for all user routines (legacy)
        const userRoutines = await getUserRoutines(clerkUserId);
        const allTasks = [];
        
        for (const routine of userRoutines) {
          try {
            const tasks = await getActiveTasksForToday(clerkUserId, routine.id);
            allTasks.push(...tasks);
          } catch (error) {
            // Log error but continue with other routines
            console.error(`Error fetching tasks for routine ${routine.id}:`, error);
          }
        }
        
        return NextResponse.json(allTasks);
      }
    } else if (type === "upcoming") {
      const tasks = await getUpcomingTasks(clerkUserId);
      return NextResponse.json(tasks);
    } else if (type === "unmarked") {
      const tasks = await getUnmarkedTasks(clerkUserId, routineId || undefined);
      return NextResponse.json(tasks);
    } else if (type === "history") {
      if (!routineId) {
        return NextResponse.json({ error: "routineId required for task history." }, { status: 400 });
      }
      const tasks = await getTaskHistory(clerkUserId, routineId);
      return NextResponse.json(tasks);
    } else {
      return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  if (url.searchParams.get("type") !== "active") {
    return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
  }

  const body = await request.json();
  const { routineId, title, description, wellnessCategories, isOptional, order, scheduledFor } = body;

  if (!routineId || !title || typeof title !== "string" || !scheduledFor) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  // Validate wellness categories if provided
  if (wellnessCategories && Array.isArray(wellnessCategories)) {
    const validCategories = ["overall_health", "brainy", "body", "money", "personal_growth", "body_maintenance", "custom"];
    const invalidCategories = wellnessCategories.filter((cat: string) => !validCategories.includes(cat));
    
    if (invalidCategories.length > 0) {
      return NextResponse.json({ error: `Invalid wellness categories: ${invalidCategories.join(", ")}` }, { status: 400 });
    }
    
    if (wellnessCategories.length > 2) {
      return NextResponse.json({ error: "Tasks can have a maximum of 2 wellness categories" }, { status: 400 });
    }
  }

  try {
    const task = await createActiveTask(clerkUserId, {
      routineId,
      title,
      description,
      wellnessCategories: wellnessCategories || [], // Include wellness categories
      isOptional,
      order,
      scheduledFor: new Date(scheduledFor),
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
