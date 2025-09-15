import test from 'node:test';
import assert from 'node:assert/strict';

interface Task {
  id: string;
  routineId: string;
}

function removeRoutineTasks(unmarked: Task[], history: Task[], routineId: string) {
  const remainingUnmarked = unmarked.filter(t => t.routineId !== routineId);
  const remainingHistory = history.filter(t => t.routineId !== routineId);
  const deletedCount = unmarked.length - remainingUnmarked.length + history.length - remainingHistory.length;
  return { remainingUnmarked, remainingHistory, deletedCount };
}

test('reset clears unmarked and history tasks for routine', () => {
  const unmarked = [
    { id: 'u1', routineId: 'r1' },
    { id: 'u2', routineId: 'r2' },
  ];
  const history = [
    { id: 'h1', routineId: 'r1' },
    { id: 'h2', routineId: 'r2' },
  ];

  const result = removeRoutineTasks(unmarked, history, 'r1');

  assert.equal(result.remainingUnmarked.length, 1);
  assert.equal(result.remainingUnmarked[0].id, 'u2');
  assert.equal(result.remainingHistory.length, 1);
  assert.equal(result.remainingHistory[0].id, 'h2');
  assert.equal(result.deletedCount, 2);
});
