// Test script to verify timeline functionality
import { db } from "../lib/db";
import { routines } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { RoutineTimeline } from "../lib/routines/timeline";

async function testTimeline() {
  try {
    // Get a sample routine
    const sampleRoutine = await db.query.routines.findFirst();
    
    if (!sampleRoutine) {
      console.log("No routines found in database");
      return;
    }
    
    console.log("Found routine:", sampleRoutine.title);
    console.log("Current timeline:", JSON.stringify(sampleRoutine.timeline, null, 2));
    
    // Check if timeline is properly typed
    const timeline = sampleRoutine.timeline as RoutineTimeline;
    
    if (Array.isArray(timeline)) {
      console.log("Timeline is valid array with", timeline.length, "events");
      timeline.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, event.type, "at", event.date);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error testing timeline:", error);
    process.exit(1);
  }
}

testTimeline(); 