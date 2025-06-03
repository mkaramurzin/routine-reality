import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createInitialTimeline } from "@/lib/routines/timeline";

type WellnessCategory = "overall_health" | "brainy" | "body" | "money" | "personal_growth" | "body_maintenance" | "custom";

interface NewRoutine {
  title: string;
  routineInfo: string;
  routineType: "template" | "standard" | "special";
  wellnessCategories?: WellnessCategory[]; // Optional wellness categories
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
      wellnessCategories: routineData.wellnessCategories || [], // Include wellness categories
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
