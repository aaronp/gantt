// node --test: the card and badge for the Acme example on a fixed day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { badgeSvg, card, coreFrom, parsePrefs } from './card.js';

const G = coreFrom(await readFile(new URL('index.html', import.meta.url), 'utf8'));
const md = await readFile(new URL('examples/acme-roadmap/ROADMAP.md', import.meta.url), 'utf8');
const at = { label: 'ROADMAP.md', src: 'examples/acme-roadmap/ROADMAP.md' };

test('counts tasks by where they stand today', () => {
  const c = card(G, md, {}, '2026-11-02', at);
  assert.equal(c.title, 'Atlas mobile app — v2 launch');
  assert.equal(c.heading.primary, '10');
  const total = Object.values(c.report).reduce((a, b) => a + b, 0);
  assert.equal(total, 10);
  assert.equal(c.report.done, 2);
  assert.ok(c.report.active >= 1);
  assert.equal(c.source.url, 'https://aaronp.github.io/gantt/?src=examples/acme-roadmap/ROADMAP.md');
});

test('open tasks past their end are late; a milestone is due on its day', () => {
  const plan = '- [ ] A `id:a` `start:2026-01-01` `dur:2d`\n- [ ] M `id:m` `start:2026-01-05` `dur:0d`\n';
  const onDay = card(G, plan, {}, '2026-01-05', at);
  assert.deepEqual(onDay.report, { done: 0, active: 1, upcoming: 0, late: 1 });
  assert.deepEqual(onDay.status, { label: '1 late', tone: 'warn' });
  assert.equal(card(G, plan, {}, '2026-01-06', at).report.late, 2);
});

test('sidecar settings shape the card; the badge follows them', () => {
  const { prefs, warnings } = parsePrefs({ title: 'Atlas', legend: [{ id: 'done', label: 'Shipped', color: '#000000' }, { id: 'nope' }], heading: { primary: 'done' } });
  assert.equal(warnings.length, 1);
  const c = card(G, md, prefs, '2026-11-02', at);
  assert.deepEqual(c.legend.map((l) => l.id), ['done']);
  assert.equal(c.heading.primary, '2');
  assert.match(badgeSvg(c), /Shipped 2/);
  assert.throws(() => parsePrefs({ colour: 'red' }), /unknown field/);
});
