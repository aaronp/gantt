// node --test: task descriptions (```md fences under a task) through parse → serialize.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { coreFrom } from './card.js';

const G = coreFrom(await readFile(new URL('index.html', import.meta.url), 'utf8'));
const task = (doc, id) => G.tasksOf(doc).find((t) => t.id === id);

test('a fenced description belongs to the task above it and round-trips', () => {
  const md = [
    '## Build',
    '- [ ] A `id:a` `start:2026-01-01` `dur:2d`',
    '  ```md',
    '  Needs **care**.',
    '',
    '  ## not a section',
    '  - [ ] not a task `id:zz` `dur:1d`',
    '  ```',
    '- [ ] B `id:b` `after:a` `dur:1d`',
  ].join('\n');
  const doc = G.parse(md);
  assert.deepEqual(G.tasksOf(doc).map((t) => t.id), ['a', 'b']);
  assert.equal(task(doc, 'a').desc, 'Needs **care**.\n\n## not a section\n- [ ] not a task `id:zz` `dur:1d`');
  assert.equal(task(doc, 'b').desc, '');
  assert.equal(G.serialize(doc), md);
});

test('a description holding a code fence gets a longer fence', () => {
  const doc = G.ops.patch(G.parse('- A `id:a` `start:2026-01-01` `dur:1d`'), 'a', { desc: '```\ncode\n```' });
  const out = G.serialize(doc);
  assert.equal(out, '- A `id:a` `start:2026-01-01` `dur:1d`\n  ````md\n  ```\n  code\n  ```\n  ````');
  assert.equal(task(G.parse(out), 'a').desc, '```\ncode\n```');
  assert.equal(G.serialize(G.ops.patch(doc, 'a', { desc: '  ' })), '- A `id:a` `start:2026-01-01` `dur:1d`');
});

test('an unclosed description is a parse error on its fence line', () => {
  assert.throws(() => G.parse('- A `id:a` `start:2026-01-01` `dur:1d`\n  ```md\n  text'), /line 2: the description of "a" is never closed/);
});
