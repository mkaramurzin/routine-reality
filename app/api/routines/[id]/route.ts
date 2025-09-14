import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getRoutineById } from "@/lib/queries/getRoutineById";
import { updateRoutineById } from "@/lib/queries/updateRoutineById";
import { deleteRoutineById } from "@/lib/queries/deleteRoutineById";
import { checkStageAdvancementEligibility } from "@/lib/queries/updateRoutineProgress";
import { addTimelineEvent, RoutineTimeline } from "@/lib/routines/timeline";

// Helper to extract route param
function getIdFromUrl(request: NextRequest): string | null {
  const id = request.nextUrl.pathname.split("/").pop();
  return id || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  const routine = await getRoutineById(clerkUserId, id);

  if (!routine) {
    return NextResponse.json({ error: "Routine not found." }, { status: 404 });
  }

  return NextResponse.json(routine);
}

export async function PATCH(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  const body = await request.json();

  try {
    // First, get the current routine to check ownership and current state
    const currentRoutine = await getRoutineById(clerkUserId, id);
    
    if (!currentRoutine) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 }
      );
    }

    // Handle direct stage increment (new UI flow)
    if (body.currentStage && body.currentStage > currentRoutine.currentStage) {
      // Validate that advancement is possible
      if (currentRoutine.status === "finished") {
        return NextResponse.json(
          { error: "Routine is already finished." },
          { status: 400 }
        );
      } else if (currentRoutine.status === "paused") {
        return NextResponse.json(
          { error: "Routine is paused." },
          { status: 400 }
        );
      } else if (currentRoutine.status === "abandoned") {
        return NextResponse.json(
          { error: "Routine is abandoned." },
          { status: 400 }
        );
      }

      // Ensure stages advance sequentially
      if (body.currentStage !== currentRoutine.currentStage + 1) {
        return NextResponse.json(
          { error: "Stages must advance sequentially." },
          { status: 400 }
        );
      }

      // Check advancement eligibility
      const eligibility = await checkStageAdvancementEligibility(
        clerkUserId,
        id
      );

      if (!eligibility) {
        return NextResponse.json(
          { error: "Unable to check advancement eligibility." },
          { status: 500 }
        );
      }

      if (!eligibility.canAdvance) {
        return NextResponse.json(
          { error: eligibility.reason },
          { status: 400 }
        );
      }

      // Validate that new stage is within bounds
      if (body.currentStage > currentRoutine.stages) {
        return NextResponse.json(
          { error: "Invalid stage number." },
          { status: 400 }
        );
      }

      // Check if this is the final stage
      if (body.currentStage === currentRoutine.stages) {
        // User is advancing to the final stage, mark as finished
        const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
        const updatedTimeline = addTimelineEvent(currentTimeline, {
          type: "finished",
        });
        
        const routine = await updateRoutineById(clerkUserId, id, {
          currentStage: body.currentStage,
          currentStageProgress: 0, // Reset progress immediately
          status: "finished",
          endDate: new Date(), // Set completion date
          timeline: updatedTimeline,
        });

        return NextResponse.json(routine);
      } else {
        // Update timeline with stage advancement and reset progress immediately
        const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
        const updatedTimeline = addTimelineEvent(currentTimeline, {
          type: "stage_advanced",
          stageNumber: body.currentStage,
        });

        // Update routine with new stage and reset progress immediately
        const routine = await updateRoutineById(clerkUserId, id, {
          currentStage: body.currentStage,
          currentStageProgress: 0, // Reset progress immediately for better UX
          timeline: updatedTimeline,
        });

        return NextResponse.json(routine);
      }
    }

    // Handle stage advancement action (legacy flow)
    if (body.action === "advanceStage") {
      // Validate that advancement is possible
      if (currentRoutine.status === "finished") {
        return NextResponse.json(
          { error: "Routine is already finished." },
          { status: 400 }
        );
      } else if (currentRoutine.status === "paused") {
        return NextResponse.json(
          { error: "Routine is paused." },
          { status: 400 }
        );
      } else if (currentRoutine.status === "abandoned") {
        return NextResponse.json(
          { error: "Routine is abandoned." },
          { status: 400 }
        );
      }

      // Check advancement eligibility
      const eligibility = await checkStageAdvancementEligibility(clerkUserId, id);
      
      if (!eligibility) {
        return NextResponse.json(
          { error: "Unable to check advancement eligibility." },
          { status: 500 }
        );
      }

      if (!eligibility.canAdvance) {
        return NextResponse.json(
          { error: eligibility.reason },
          { status: 400 }
        );
      }

      // Check if user is on the final stage
      if (eligibility.isOnFinalStage) {
        // User is on the final stage, mark as finished
        const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
        const updatedTimeline = addTimelineEvent(currentTimeline, {
          type: "finished",
        });
        
        const routine = await updateRoutineById(clerkUserId, id, {
          status: "finished",
          endDate: new Date(), // Set completion date
          timeline: updatedTimeline,
        });
        return NextResponse.json(routine);
      } else {
        // Advance to next stage and update timeline
        const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
        const newStage = currentRoutine.currentStage + 1;
        const updatedTimeline = addTimelineEvent(currentTimeline, {
          type: "stage_advanced",
          stageNumber: newStage,
        });
        
        const routine = await updateRoutineById(clerkUserId, id, {
          currentStage: newStage,
          currentStageProgress: 0, // Reset progress for new stage
          timeline: updatedTimeline,
        });
        return NextResponse.json(routine);
      }
    }

    // Handle regular field updates
    const allowedFields = [
      "title",
      "routineInfo",
      "startDate",
      "endDate",
      "stages",
      "thresholds",
      "currentStage",
      "currentStageProgress",
      "status",
    ];

    const updateData = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate as string);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate as string);
    }

    // Handle routine reset (when currentStage is set to 1 and currentStageProgress to 0)
    if (updateData.currentStage === 1 && updateData.currentStageProgress === 0 && currentRoutine.currentStage > 1) {
      const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
      const updatedTimeline = addTimelineEvent(currentTimeline, {
        type: "reset",
      });
      updateData.timeline = updatedTimeline;
    }

    // If status is being changed, update timeline
    if (updateData.status && updateData.status !== currentRoutine.status) {
      const currentTimeline = (currentRoutine.timeline as RoutineTimeline) || [];
      let timelineEvent: { type: string } | null = null;

      switch (updateData.status) {
        case "paused":
          timelineEvent = { type: "paused" };
          break;
        case "active":
          if (currentRoutine.status === "paused") {
            timelineEvent = { type: "resumed" };
          } else if (currentRoutine.status === "abandoned") {
            timelineEvent = { type: "resumed" };
          }
          break;
        case "finished":
          timelineEvent = { type: "finished" };
          break;
        case "abandoned":
          timelineEvent = { type: "abandoned" };
          break;
      }

      if (timelineEvent) {
        const updatedTimeline = addTimelineEvent(currentTimeline, timelineEvent as any);
        updateData.timeline = updatedTimeline;
      }
    }

    const routine = await updateRoutineById(clerkUserId, id, updateData);

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(routine);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ error: "Missing routine ID" }, { status: 400 });
  }

  try {
    const deletedRoutine = await deleteRoutineById(clerkUserId, id);

    if (!deletedRoutine) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Routine deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}