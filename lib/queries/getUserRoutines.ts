import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserRoutines(clerkUserId: string) {
  return db
    .select({
      id: routines.id,
      title: routines.title,
      routineInfo: routines.routineInfo,
      startDate: routines.startDate,
      endDate: routines.endDate,
      stages: routines.stages,
      thresholds: routines.thresholds,
      currentStage: routines.currentStage,
      status: routines.status,
      createdAt: routines.createdAt,
      updatedAt: routines.updatedAt,
    })
    .from(routines)
    .innerJoin(users, eq(routines.userId, users.id))
    .where(eq(users.clerkUserId, clerkUserId));
}
