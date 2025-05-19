import { db } from "../db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateUserTimezone(clerkUserId: string, timezone: string) {
  const [updatedUser] = await db
    .update(users)
    .set({
      timezone,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, clerkUserId))
    .returning({
      id: users.id,
      clerkUserId: users.clerkUserId,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updatedUser;
}
