import assert from 'node:assert/strict';
import { createWorkspaceMutationGuard } from '../../src/ui/workspace-mutation-guard.mjs';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function runMutation(guard, name, gate) {
  if (!guard.tryBegin()) return `${name}:blocked`;
  try {
    await gate.promise;
    return `${name}:done`;
  } finally {
    guard.end();
  }
}

{
  const guard = createWorkspaceMutationGuard();
  const toggleGate = deferred();
  const toggle = runMutation(guard, 'toggle', toggleGate);
  assert.equal(guard.isActive(), true, 'Toggle-Mutation muss den Workspace exklusiv sperren.');

  const resetGate = deferred();
  assert.equal(await runMutation(guard, 'reset', resetGate), 'reset:blocked', 'Reset darf einen laufenden Toggle-Save nicht überholen.');

  toggleGate.resolve();
  assert.equal(await toggle, 'toggle:done');
  assert.equal(guard.isActive(), false, 'Workspace muss nach Toggle-Abschluss wieder freigegeben werden.');
}

{
  const guard = createWorkspaceMutationGuard();
  const resetGate = deferred();
  const reset = runMutation(guard, 'reset', resetGate);
  assert.equal(guard.isActive(), true, 'Reset-Mutation muss den Workspace exklusiv sperren.');

  const toggleGate = deferred();
  assert.equal(await runMutation(guard, 'toggle', toggleGate), 'toggle:blocked', 'Toggle darf einen laufenden Reset nicht überholen.');

  resetGate.resolve();
  assert.equal(await reset, 'reset:done');
  assert.equal(guard.isActive(), false, 'Workspace muss nach Reset-Abschluss wieder freigegeben werden.');
}

console.log('🟢 Workspace-Mutationen: Toggle ↔ Reset sind in beiden Race-Reihenfolgen exklusiv serialisiert.');
