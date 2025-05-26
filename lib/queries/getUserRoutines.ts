import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserRoutines(clerkUserId: string) {
  return db
    .select({
      id: routines.id,
      title: routines.title,
      routineInfo: routines.routineInfo,
      routineType: routines.routineType,
      startDate: routines.startDate,
      endDate: routines.endDate,
      stages: routines.stages,
      thresholds: routines.thresholds,
      currentStage: routines.currentStage,
      currentStageProgress: routines.currentStageProgress,
      status: routines.status,
      createdAt: routines.createdAt,
      updatedAt: routines.updatedAt,
    })
    .from(routines)
    .innerJoin(users, eq(routines.userId, users.id))
    .where(eq(users.clerkUserId, clerkUserId));
}
