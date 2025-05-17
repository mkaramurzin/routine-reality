import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getActiveTasksForToday } from "@/lib/queries/getActiveTasks";
import { getUnmarkedTasks } from "@/lib/queries/getUnmarkedTasks";
import { getTaskHistory } from "@/lib/queries/getTaskHistory";
import { createActiveTask } from "@/lib/queries/createActiveTask";

export async function GET(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const routineId = url.searchParams.get("routineId");

  if (!type || !routineId) {
    return NextResponse.json({ error: "Missing query parameters." }, { status: 400 });
  }

  try {
    if (type === "active") {
      const tasks = await getActiveTasksForToday(clerkUserId, routineId, new Date());
      return NextResponse.json(tasks);
    } else if (type === "unmarked") {
      const tasks = await getUnmarkedTasks(clerkUserId, routineId);
      return NextResponse.json(tasks);
    } else if (type === "history") {
      const tasks = await getTaskHistory(clerkUserId, routineId);
      return NextResponse.json(tasks);
    } else {
      return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  if (url.searchParams.get("type") !== "active") {
    return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
  }

  const body = await req.json();
  const { routineId, title, description, isOptional, order, scheduledFor } = body;

  if (!routineId || !title || typeof title !== "string" || !scheduledFor) {
    return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
  }

  try {
    const task = await createActiveTask(clerkUserId, {
      routineId,
      title,
      description,
      isOptional,
      order,
      scheduledFor: new Date(scheduledFor),
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
