import assert from 'node:assert/strict';
import { createWorkspaceMutationGuard } from '../../src/ui/workspace-mutation-guard.mjs';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function runOperation(guard, name, gate) {
  if (!guard.tryBegin()) return `${name}:blocked`;
  try {
    await gate.promise;
    return `${name}:done`;
  } finally {
    guard.end();
  }
}

async function assertExclusive(firstName, secondName, message) {
  const guard = createWorkspaceMutationGuard();
  const firstGate = deferred();
  const first = runOperation(guard, firstName, firstGate);
  assert.equal(guard.isActive(), true, `${firstName} muss den Workspace exklusiv sperren.`);

  const secondGate = deferred();
  assert.equal(await runOperation(guard, secondName, secondGate), `${secondName}:blocked`, message);

  firstGate.resolve();
  assert.equal(await first, `${firstName}:done`);
  assert.equal(guard.isActive(), false, `Workspace muss nach ${firstName}-Abschluss wieder freigegeben werden.`);
}

await assertExclusive('toggle', 'reset', 'Reset darf einen laufenden Toggle-Save nicht überholen.');
await assertExclusive('reset', 'toggle', 'Toggle darf einen laufenden Reset nicht überholen.');
await assertExclusive('load', 'toggle', 'Toggle darf einen laufenden Sichtbarkeits-Load nicht überholen.');
await assertExclusive('toggle', 'load', 'Sichtbarkeits-Load darf einen laufenden Toggle-Save nicht überholen.');
await assertExclusive('load', 'reset', 'Reset darf einen laufenden Sichtbarkeits-Load nicht überholen.');
await assertExclusive('reset', 'load', 'Sichtbarkeits-Load darf einen laufenden Reset nicht überholen.');

console.log('🟢 Workspace-Zustand: Load, Toggle und Reset sind in allen geforderten Race-Reihenfolgen exklusiv serialisiert.');
