import { db } from "../db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser(clerkUserId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: {
      id: true,
      clerkUserId: true,
      fullName: true,
      timezone: true,
      language: true,
      profilePictureUrl: true,
      productivityGoal: true,
      onboarded: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
