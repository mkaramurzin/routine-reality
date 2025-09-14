import test from 'node:test';
import assert from 'node:assert/strict';

interface Routine {
  currentStage: number;
  stages: number;
  status: string;
}

interface Eligibility {
  canAdvance: boolean;
  reason?: string | null;
}

// Simplified logic mirroring the direct currentStage update branch
async function handleStageAdvance(
  body: { currentStage?: number },
  currentRoutine: Routine,
  eligibility: Eligibility
) {
  if (body.currentStage && body.currentStage > currentRoutine.currentStage) {
    if (body.currentStage !== currentRoutine.currentStage + 1) {
      return { status: 400, message: 'Stages must advance sequentially.' };
    }

    if (!eligibility.canAdvance) {
      return { status: 400, message: eligibility.reason };
    }

    return { status: 200, newStage: body.currentStage };
  }

  return { status: 200, newStage: currentRoutine.currentStage };
}

test('advances when sequential and eligible', async () => {
  const res = await handleStageAdvance(
    { currentStage: 2 },
    { currentStage: 1, stages: 3, status: 'active' },
    { canAdvance: true }
  );
  assert.equal(res.status, 200);
  assert.equal(res.newStage, 2);
});

test('fails when skipping stages', async () => {
  const res = await handleStageAdvance(
    { currentStage: 3 },
    { currentStage: 1, stages: 3, status: 'active' },
    { canAdvance: true }
  );
  assert.equal(res.status, 400);
});

test('fails when lacking progress', async () => {
  const res = await handleStageAdvance(
    { currentStage: 2 },
    { currentStage: 1, stages: 3, status: 'active' },
    { canAdvance: false, reason: 'Need more progress' }
  );
  assert.equal(res.status, 400);
});

