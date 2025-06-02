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
      fullName: users.fullName,
      timezone: users.timezone,
      language: users.language,
      profilePictureUrl: users.profilePictureUrl,
      productivityGoal: users.productivityGoal,
      onboarded: users.onboarded,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updatedUser;
}

export async function updateUserProfile(
  clerkUserId: string, 
  profileData: {
    fullName?: string;
    language?: string;
    profilePictureUrl?: string;
    productivityGoal?: string;
    timezone?: string;
    onboarded?: boolean;
  }
) {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...profileData,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, clerkUserId))
    .returning({
      id: users.id,
      clerkUserId: users.clerkUserId,
      fullName: users.fullName,
      timezone: users.timezone,
      language: users.language,
      profilePictureUrl: users.profilePictureUrl,
      productivityGoal: users.productivityGoal,
      onboarded: users.onboarded,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updatedUser;
}
