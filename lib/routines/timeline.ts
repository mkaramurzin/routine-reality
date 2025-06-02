// Timeline types and utilities for tracking routine milestones

export type TimelineEventType = 
  | "created" 
  | "stage_advanced" 
  | "skipped" 
  | "reset" 
  | "paused" 
  | "resumed" 
  | "finished";

export interface TimelineEvent {
  type: TimelineEventType;
  date: string; // ISO 8601
  stageNumber?: number;
}

export interface RoutineTimeline extends Array<TimelineEvent> {}

/**
 * Add a new event to the timeline
 */
export function addTimelineEvent(
  timeline: RoutineTimeline,
  event: Omit<TimelineEvent, 'date'>
): RoutineTimeline {
  return [
    ...timeline,
    {
      ...event,
      date: new Date().toISOString(),
    },
  ];
}

/**
 * Create the initial timeline when a routine is created
 */
export function createInitialTimeline(): RoutineTimeline {
  return [
    {
      type: "created",
      date: new Date().toISOString(),
    },
  ];
}

/**
 * Check if a stage was recently advanced (within the last hour)
 * This helps the cron job determine if progress should be reset
 */
export function wasStageRecentlyAdvanced(timeline: RoutineTimeline): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Find the most recent stage_advanced event
  const recentStageAdvance = timeline
    .filter(event => event.type === "stage_advanced")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  if (!recentStageAdvance) return false;
  
  return new Date(recentStageAdvance.date) > oneHourAgo;
}

/**
 * Get the date when the routine reached a specific stage
 */
export function getStageStartDate(timeline: RoutineTimeline, stageNumber: number): Date | null {
  const event = timeline.find(
    event => event.type === "stage_advanced" && event.stageNumber === stageNumber
  );
  
  return event ? new Date(event.date) : null;
} 