# Routines

This directory contains implementations for different routine templates that users can add to their accounts.

## Directory Structure

- `index.ts` - Exports all routine creation functions
- `monk-mode.ts` - Implementation of the Monk Mode routine
- Add additional routine implementation files as needed

## Adding a New Routine

To add a new routine:

1. Create a new file named after your routine (e.g., `morning-ritual.ts`)
2. Implement a function that accepts a `clerkUserId` and creates the routine for that user
3. Export your function from the `index.ts` file
4. Create an API route in `app/api/routines/[routine-name]/route.ts` that uses your function

## Routine Implementation Template

```typescript
import { db } from "@/lib/db";
import { routines, taskSets, tasks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createYourRoutineName(clerkUserId: string) {
  // Find the user by their Clerk ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create the routine
  const [routine] = await db.insert(routines).values({
    userId: user.id,
    title: "Your Routine Title",
    routineInfo: "Description of your routine",
    startDate: new Date(),
    endDate: new Date(Date.now() + /* duration in ms */),
    stages: /* number of stages */,
    thresholds: [/* thresholds for each stage */],
    currentStage: 1,
    status: "active",
  }).returning();

  // Create task sets and tasks as needed...

  return routine;
}
``` 