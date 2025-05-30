import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function getRoutineById(clerkUserId: string, routineId: string) {
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
      timeline: routines.timeline,
      createdAt: routines.createdAt,
      updatedAt: routines.updatedAt,
    })
    .from(routines)
    .innerJoin(users, eq(routines.userId, users.id))
    .where(
      and(eq(users.clerkUserId, clerkUserId), eq(routines.id, routineId))
    )
    .then((rows) => rows[0] || null);
}
