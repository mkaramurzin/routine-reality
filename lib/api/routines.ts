interface Routine {
  id: string;
  title: string;
  routineInfo: string;
  routineType: string;
  startDate: string;
  endDate: string;
  stages: number;
  thresholds: number[];
  currentStage: number;
  currentStageProgress: number;
  status: "active" | "paused" | "finished" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch a routine by ID
 */
export async function getRoutineById(routineId: string): Promise<Routine> {
  const response = await fetch(`/api/routines/${routineId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch routine");
  }

  return response.json();
}

/**
 * Advance a routine to the next stage
 */
export async function advanceRoutineStage(routineId: string): Promise<Routine> {
  const response = await fetch(`/api/routines/${routineId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "advanceStage",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to advance routine stage");
  }

  return response.json();
}

/**
 * Get all user routines
 */
export async function getUserRoutines(): Promise<Routine[]> {
  const response = await fetch("/api/routines", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch routines");
  }

  return response.json();
} 