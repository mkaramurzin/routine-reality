import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createInitialTimeline } from "@/lib/routines/timeline";

interface NewRoutine {
  title: string;
  routineInfo: string;
  routineType: "template" | "standard" | "special";
  startDate: Date;
  endDate: Date;
  stages: number;
  thresholds: number[];
}

export async function createRoutine(
  clerkUserId: string,
  routineData: NewRoutine
) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const [newRoutine] = await db
    .insert(routines)
    .values({
      userId: user.id,
      title: routineData.title,
      routineInfo: routineData.routineInfo,
      routineType: routineData.routineType,
      startDate: routineData.startDate,
      endDate: routineData.endDate,
      stages: routineData.stages,
      thresholds: routineData.thresholds,
      currentStage: 1, // Initial stage
      currentStageProgress: 0, // Initial progress
      status: "active",
      timeline: createInitialTimeline(),
    })
    .returning();

  return newRoutine;
}
