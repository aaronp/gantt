#!/usr/bin/env node
// agile <plan.md>: serves the chart and that plan on localhost, then opens it in the browser.
//   Markdown (.md) and card settings (.card.json) under the current directory are served too, so ?src= can
//   switch plans; File → Save writes the plan back (PUT), and the card designer saves <plan>.card.json beside it.
// agile card <plan.md> [out-dir]: writes card.json, the plan as a dashboard card (out-dir defaults to the plan's folder).
// agile badge <plan.md> [out-dir]: writes badge.svg, drawn from the same card.
//   Both read the optional sidecar <plan>.card.json. The card links to AGILE_HOST (default https://aaronp.github.io/gantt/)
//   with ?src=AGILE_SRC, where the published markdown lives (default: the path given, relative to AGILE_HOST).
import { createServer } from 'node:http';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { badgeSvg, card, coreFrom, parsePrefs, sidecarOf } from '../card.js';

const pkg = fileURLToPath(new URL('..', import.meta.url));
const die = (msg) => { console.error(`agile: ${msg}`); process.exit(1); };
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'card' || cmd === 'badge') {
  const [md, out = dirname(md ?? '')] = args;
  if (!md) die(`usage: agile ${cmd} <plan.md> [out-dir]`);
  let prefs = {};
  try {
    const r = parsePrefs(JSON.parse(await readFile(sidecarOf(md), 'utf8')));
    if (r.warnings.length > 0) die(`${sidecarOf(md)}: ${r.warnings.join('; ')}`);
    prefs = r.prefs;
  } catch (e) {
    if (e.code !== 'ENOENT') die(`${sidecarOf(md)}: ${e.message}`);
  }
  try {
    const G = coreFrom(await readFile(join(pkg, 'index.html'), 'utf8'));
    const c = card(G, await readFile(md, 'utf8'), prefs, new Date().toLocaleDateString('en-CA'), { label: md, src: process.env.AGILE_SRC || md }, process.env.AGILE_HOST || undefined);
    const [name, body] = cmd === 'card' ? ['card.json', JSON.stringify(c, null, 2) + '\n'] : ['badge.svg', badgeSvg(c)];
    await writeFile(join(out, name), body);
    console.log(`Wrote ${join(out, name)}`);
  } catch (e) {
    die(`${md}: ${e.message}`);
  }
  process.exit(0);
}

if (!cmd || cmd === '-h' || cmd === '--help') {
  console.error('Usage: agile <plan.md>                    (PORT=8000 picks the port, NO_OPEN=1 skips opening a browser)');
  console.error('       agile card <plan.md> [out-dir]     (writes card.json)');
  console.error('       agile badge <plan.md> [out-dir]    (writes badge.svg)');
  process.exit(cmd ? 0 : 1);
}

const root = resolve('.');
const plan = resolve(cmd);
if (!plan.startsWith(root + sep)) die(`${cmd} must be inside the current directory`);
await readFile(plan).catch((e) => die(`cannot read ${cmd}: ${e.message}`));

/* The viewer's own files, from the package. Nothing else of the package is reachable. */
const VIEWER = { '/': 'index.html', '/index.html': 'index.html', '/card.html': 'card.html', '/card.js': 'card.js', '/support.js': 'support.js', '/vendor/react.js': 'vendor/react.js', '/vendor/react-dom.js': 'vendor/react-dom.js' };
const TYPES = { html: 'text/html', js: 'text/javascript', md: 'text/markdown', json: 'application/json' };
const exists = (p) => stat(p).then(() => true, () => false);
/* Data: markdown and card settings under the current directory. A .card.json can be created when its plan exists. */
const data = (abs) => abs.startsWith(root + sep) && /\.(md|card\.json)$/i.test(abs);
const writable = async (abs) => data(abs) && (/\.md$/i.test(abs) ? exists(abs) : exists(abs.replace(/\.card\.json$/i, '.md')));
// Loopback names a browser may use for this server. Anything else in Host means DNS rebinding, so it is refused.
const hosts = (port) => new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);

const handler = async (req, res) => {
  if (!hosts(server.address().port).has(req.headers.host)) return res.writeHead(403).end('Forbidden host');
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const viewer = VIEWER[p];
  const target = viewer ? join(pkg, viewer) : resolve(root, '.' + p);
  if (!viewer && !data(target)) return res.writeHead(404).end('Not found');
  if (req.method === 'PUT') {
    // Cross-site pages cannot get here: a PUT needs a CORS preflight, which this server never answers.
    if (viewer || !(await writable(target))) return res.writeHead(403).end('Not writable');
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      await writeFile(`${target}.agile-tmp`, Buffer.concat(chunks));
      await rename(`${target}.agile-tmp`, target); // whole file or nothing, never half-written
      return res.writeHead(204).end();
    } catch (e) {
      return res.writeHead(500).end(e.message);
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end('Method not allowed');
  try {
    const body = await readFile(target);
    const type = TYPES[target.split('.').pop()] ?? 'application/octet-stream';
    // x-agile-writable tells the page it can offer File → Save (a PUT back to this URL).
    res.writeHead(200, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store', ...(!viewer && (await writable(target)) ? { 'x-agile-writable': '1' } : {}) }).end(body);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500).end(e.message);
  }
};
const server = createServer(handler);

server.listen(Number(process.env.PORT ?? 0), '127.0.0.1', () => {
  const { port } = server.address();
  // Also answer on ::1 so http://localhost:<port> works where it resolves to IPv6; skipped if that is unavailable.
  createServer(handler).on('error', () => {}).listen(port, '::1');
  const url = `http://127.0.0.1:${port}/?src=${relative(root, plan).split(sep).map(encodeURIComponent).join('/')}`;
  console.log(`Serving ${cmd} at ${url}  (Ctrl-C to stop)`);
  if (process.env.NO_OPEN) return;
  const [open, argv] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  spawn(open, argv, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
});
