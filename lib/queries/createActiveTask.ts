import { db } from "@/lib/db";
import { activeTasks, routines, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface NewActiveTask {
  routineId: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  order?: number;
  scheduledFor: Date;
}

export async function createActiveTask(clerkUserId: string, data: NewActiveTask) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) throw new Error("User not found");

  const routine = await db.query.routines.findFirst({
    where: and(eq(routines.id, data.routineId), eq(routines.userId, user.id)),
    columns: { id: true },
  });

  if (!routine) throw new Error("Routine not found");

  const [newTask] = await db
    .insert(activeTasks)
    .values({
      userId: user.id,
      routineId: data.routineId,
      title: data.title,
      description: data.description ?? null,
      isOptional: data.isOptional ?? false,
      order: data.order ?? null,
      scheduledFor: data.scheduledFor,
    })
    .returning();

  return newTask;
}
