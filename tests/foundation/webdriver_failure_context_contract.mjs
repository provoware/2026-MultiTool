import assert from 'node:assert/strict';
import { formatWebDriverDiagnostic, sessionStartupTimeoutMs } from './webdriver_failure_context.mjs';

const base = {
  browser:'firefox', version:'153.0', phase:'responsive-layout',
  viewport:{ width:457, height:343, zoom:175 },
  request:{ method:'POST', path:'/session/private-session-token/execute/sync?secret=hidden', timeoutMs:10000 },
};

const timeout = formatWebDriverDiagnostic({ ...base, error:{ name:'TimeoutError', message:'private content' } });
assert.match(timeout, /\[WebDriver TIMEOUT\]/);
assert.match(timeout, /browser=firefox version=153.0 phase=responsive-layout/);
assert.match(timeout, /viewport=457x343@175%/);
assert.match(timeout, /request=POST \/session\/:id\/execute\/sync timeout_ms=10000/);
assert.doesNotMatch(timeout, /private|hidden|secret|content/);

const transport = formatWebDriverDiagnostic({ ...base, error:{ name:'TypeError' } });
assert.match(transport, /\[WebDriver TRANSPORT\]/);
const other = formatWebDriverDiagnostic({ ...base, error:{ name:'Error' } });
assert.match(other, /\[WebDriver ERROR\]/);

const invalid = formatWebDriverDiagnostic({
  browser:'firefox\nTOKEN', version:'123\nPASSWORD', phase:'layout\nPASSWORD',
  viewport:{ width:'secret', height:-1, zoom:NaN },
  request:{ method:'GET\nPASSWORD', path:'/status?password=secret', timeoutMs:'secret' },
  error:{ name:'Error' },
});
assert.doesNotMatch(invalid, /\n|PASSWORD|secret|password=/);
assert.match(invalid, /viewport=0x-1@0%/);
assert.equal(sessionStartupTimeoutMs('firefox'), 90000);
assert.equal(sessionStartupTimeoutMs('chrome'), 15000);
assert.equal(sessionStartupTimeoutMs('unknown'), 15000);
console.log('🟢 WebDriver-Diagnose: Kontext, Zeitüberschreitung, Transport und Datenschutz PASS');
