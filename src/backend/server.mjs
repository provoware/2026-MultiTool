import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const PUBLIC = join(ROOT, 'src', 'ui');
const host = process.env.PROVOWARE_HOST || '127.0.0.1';
const port = Number(process.env.PROVOWARE_PORT || 5000);
const session = process.env.PROVOWARE_SESSION || 'unknown';
const checkpointPath = join(ROOT, 'runtime', 'last-checkpoint.json');

const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8' };
const json = (res, code, body) => { res.writeHead(code, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosn' }); res.end(JSON.stringify(body)); };
async function writeCheckpoint(reason) {
  const record = { session, pid:process.pid, at:new Date().toISOString(), reason };
  await writeFile(checkpointPath, JSON.stringify(record, null, 2), 'utf8');
  return record;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/health') return json(res, 200, { status:'ok', session, pid:process.pid, port });
    if (req.url === '/api/status') return json(res, 200, { status:'ready', session, localOnly: host === '127.0.0.1' });
    if (req.url === '/api/checkpoint' && req.method === 'POST') {
      const record = await writeCheckpoint('api-checkpoint');
      return json(res, 200, { status:'saved', ...record });
    }
    if (req.url === '/api/shutdown' && req.method === 'POST') {
      if (typeof process.send !== 'function') return json(res, 409, { status:'blocked', reason:'no-process-owner' });
      const record = await writeCheckpoint('UI_LOGOUT');
      res.once('finish', () => process.send({ type:'shutdown-request', reason:'UI_LOGOUT', checkpointDone:true }));
      return json(res, 202, { status:'accepted', checkpointAt:record.at, reason:'UI_LOGOUT' });
    }

    const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
    const safe = normalize(requested).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
    const file = join(PUBLIC, safe);
    if (!file.startsWith(PUBLIC)) return json(res, 403, { error:'forbidden' });
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'x-content-type-options':'nosniff', 'cache-control':'no-store' });
    res.end(data);
  } catch (error) {
    if (error?.code === 'ENOENT') return json(res, 404, { error:'not-found' });
    if (error instanceof URIError) return json(res, 400, { error:'invalid-url-encoding' });
    console.error(error);
    json(res, 500, { error:'internal-error' });
  }
});

server.listen(port, host, () => console.log(`BACKEND_READY http://${host}:${port}`));

async function stop(signal) {
  console.log(`BACKEND_SHUTDOWN ${signal}`);
  server.close(() => process.exit(0));
  if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  setTimeout(() => process.exit(1), 1200).unref();
}
process.on('SIGTERM', () => void stop('SIGTERM'));
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGHUP', () => void stop('SIGHUP'));
