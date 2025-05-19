import { db } from "@/lib/db";
import { routines, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface NewRoutine {
  title: string;
  routineInfo: string;
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
      startDate: routineData.startDate,
      endDate: routineData.endDate,
      stages: routineData.stages,
      thresholds: routineData.thresholds,
      currentStage: 1, // Initial stage
      status: "active",
    })
    .returning();

  return newRoutine;
}
