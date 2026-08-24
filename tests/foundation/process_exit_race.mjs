import { EventEmitter } from 'node:events';
import { terminateOwnedProcess } from '../../src/core/lifecycle.mjs';

class SynchronousExitChild extends EventEmitter {
  constructor() {
    super();
    this.exitCode = null;
    this.signalCode = null;
    this.signals = [];
  }

  kill(signal) {
    this.signals.push(signal);
    if (signal === 'SIGTERM') return true;
    if (signal === 'SIGKILL') {
      this.exitCode = 0;
      this.signalCode = 'SIGKILL';
      // Absichtlich synchron: simuliert Exit genau vor einer nachträglichen Listener-Registrierung.
      this.emit('exit', 0, 'SIGKILL');
      return true;
    }
    return false;
  }
}

const child = new SynchronousExitChild();
const started = Date.now();
const result = await terminateOwnedProcess(child, {
  signal: 'SIGTERM',
  timeoutMs: 20,
  escalationTimeoutMs: 100,
});
const duration = Date.now() - started;

if (!result.stopped) throw new Error('Race-Fixture wurde nicht als beendet erkannt.');
if (!result.escalated) throw new Error('Race-Fixture hätte eskalieren müssen.');
if (duration > 500) throw new Error(`Shutdown-Race dauerte unerwartet lange: ${duration} ms.`);
if (child.signals.join(',') !== 'SIGTERM,SIGKILL') {
  throw new Error(`Unerwartete Signalfolge: ${child.signals.join(',')}`);
}

console.log('🟢 REG-LIFE-009 Exit-vor-Listener-Race → bounded shutdown PASS');
