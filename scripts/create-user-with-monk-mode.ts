import "dotenv/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createMonkModeRoutine } from "@/lib/routines";
import { v4 as uuidv4 } from "uuid";

async function createUserWithMonkMode() {
  // Generate a mock Clerk user ID
  const mockClerkUserId = `user_${uuidv4()}`;
  
  // Insert a new user
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: mockClerkUserId,
      timezone: "America/Los_Angeles", // Timezone
    })
    .returning();

  console.log(`✅ Created user with ID: ${user.id}`);
  console.log(`✅ Clerk User ID: ${user.clerkUserId}`);

  // Assign the monk-mode routine to the user
  try {
    const routine = await createMonkModeRoutine(user.clerkUserId);
    console.log(`✅ Monk Mode routine assigned to user, routine ID: ${routine.id}`);
    
    // Log out the complete user and routine details
    console.log("User details:", user);
    console.log("Routine details:", routine);
    
    return { user, routine };
  } catch (error) {
    console.error("❌ Failed to assign Monk Mode routine:", error);
    throw error;
  }
}

// Execute the function
createUserWithMonkMode()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 