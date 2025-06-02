import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RoutineTimeline } from "@/lib/routines/timeline";

interface UpdateRoutineData {
  title?: string;
  routineInfo?: string;
  routineType?: "template" | "standard" | "special";
  startDate?: Date;
  endDate?: Date;
  stages?: number;
  thresholds?: number[];
  currentStage?: number;
  currentStageProgress?: number;
  status?: "active" | "paused" | "finished" | "abandoned";
  timeline?: RoutineTimeline;
}

export async function updateRoutineById(
  clerkUserId: string,
  routineId: string,
  data: UpdateRoutineData
) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const [updatedRoutine] = await db
    .update(routines)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(routines.id, routineId), eq(routines.userId, user.id)))
    .returning();

  return updatedRoutine;
}
