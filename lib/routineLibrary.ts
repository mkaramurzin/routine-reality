export interface RoutineDefinition {
  key: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const AVAILABLE_ROUTINES: RoutineDefinition[] = [
  {
    key: 'monk-mode',
    title: 'Monk Mode',
    description: '3-week intensive routine focused on meditation, exercise, and sobriety to build discipline and mental clarity.',
    duration: '3 weeks',
    difficulty: 'Advanced'
  },
  {
    key: 'morning-warrior',
    title: 'Morning Warrior',
    description: '2-week routine to establish a powerful morning routine with exercise, journaling, and goal-setting.',
    duration: '2 weeks', 
    difficulty: 'Beginner'
  },
  {
    key: 'productivity-beast',
    title: 'Productivity Beast',
    description: '4-week routine to maximize focus and output through time-blocking, deep work, and energy management.',
    duration: '4 weeks',
    difficulty: 'Intermediate'
  },
  {
    key: 'health-optimizer',
    title: 'Health Optimizer',
    description: '3-week routine combining nutrition tracking, consistent exercise, and sleep optimization for peak physical performance.',
    duration: '3 weeks',
    difficulty: 'Intermediate'
  }
];

// Map routine keys to their API endpoints
export const ROUTINE_API_ENDPOINTS = {
  'monk-mode': '/api/routines/monk-mode',
  'morning-warrior': '/api/routines/morning-warrior',
  'productivity-beast': '/api/routines/productivity-beast',
  'health-optimizer': '/api/routines/health-optimizer'
} as const;

export type RoutineKey = keyof typeof ROUTINE_API_ENDPOINTS;

export async function createRoutineForUser(routineKey: RoutineKey) {
  const endpoint = ROUTINE_API_ENDPOINTS[routineKey];
  if (!endpoint) {
    throw new Error(`Unknown routine key: ${routineKey}`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create routine');
  }

  return response.json();
} 