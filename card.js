/**
 * A dashboard card for a plan, as data (card.json), and a status badge drawn from it (badge.svg).
 * Shared by the `agile` CLI (Node) and the card designer (card.html). No DOM, no clock: "today" is passed in.
 *
 * card.json (version 1) is tool-neutral: title, subtitle, a status pill, one big number, a legend with a
 * count per item, and a source link. What it says comes from an optional sidecar, <plan>.card.json.
 */

/** Where the card's link opens the plan. The CLI takes AGILE_HOST from the environment to point elsewhere. */
export const AGILE_HOST = 'https://aaronp.github.io/gantt/';
export const STATUSES = ['done', 'active', 'upcoming', 'late'];
export const DEFAULT_COLORS = { done: '#1E7A46', active: '#2F5BD3', upcoming: '#6B7280', late: '#B42318' };
const DEFAULT_LABELS = { done: 'Done', active: 'In progress', upcoming: 'Upcoming', late: 'Late' };

/** ROADMAP.md → ROADMAP.card.json */
export const sidecarOf = (md) => md.replace(/\.md$/i, '') + '.card.json';

/**
 * The page's parser/scheduler (`G`), cut out of index.html so the CLI and designer read plans exactly as the chart does.
 * ponytail: relies on G being the first `})();` in the x-dc script; move G into its own file if that ever stops holding.
 */
export const coreFrom = (html) => {
  const m = /<script type="text\/x-dc" data-dc-script>\n([\s\S]*?\n\}\)\(\);)\n/.exec(html);
  if (!m || !m[1].includes('const G = (() => {')) throw new Error('could not find the plan parser (G) in index.html');
  return new Function(m[1] + '\nreturn G;')();
};

/** Where a task stands on `today` (a day number). Tasks without a checkbox can't be ticked, so once past they count as done. */
export const statusOf = (t, s, today) => {
  const last = Math.max(s.end, s.start + 1); /* a milestone occupies its day */
  if (t.done || (!t.box && last <= today)) return 'done';
  return last <= today ? 'late' : s.start <= today ? 'active' : 'upcoming';
};

const KEYS = ['title', 'subtitle', 'heading', 'legend', 'hideZero', 'source'];
const fail = (msg) => { throw new Error(`card settings: ${msg}`); };
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v, where) => { if (v !== undefined && typeof v !== 'string') fail(`${where} must be a string`); };

/** Checks a parsed sidecar. Unknown legend ids are dropped with a warning; anything else wrong throws. */
export const parsePrefs = (json) => {
  if (!isObj(json)) fail('expected an object');
  const warnings = [];
  Object.keys(json).forEach((k) => { if (!KEYS.includes(k)) fail(`unknown field "${k}" (expected ${KEYS.join(', ')})`); });
  str(json.title, 'title'); str(json.subtitle, 'subtitle');
  if (json.hideZero !== undefined && typeof json.hideZero !== 'boolean') fail('hideZero must be true or false');
  if (json.heading !== undefined) {
    if (!isObj(json.heading)) fail('heading must be an object');
    const p = json.heading.primary;
    if (p !== undefined && p !== 'total' && !STATUSES.includes(p)) fail(`heading.primary must be "total" or one of ${STATUSES.join(', ')}`);
    str(json.heading.label, 'heading.label');
  }
  if (json.source !== undefined) { if (!isObj(json.source)) fail('source must be an object'); str(json.source.label, 'source.label'); }
  let legend;
  if (json.legend !== undefined) {
    if (!Array.isArray(json.legend)) fail('legend must be a list');
    legend = json.legend.filter((l, i) => {
      if (!isObj(l)) fail(`legend[${i}] must be an object`);
      str(l.label, `legend[${i}].label`); str(l.color, `legend[${i}].color`);
      if (STATUSES.includes(l.id)) return true;
      warnings.push(`unknown legend id "${l.id}" (expected one of ${STATUSES.join(', ')})`);
      return false;
    });
  }
  return { prefs: { ...json, ...(legend ? { legend } : {}) }, warnings };
};

/**
 * The card for a plan. `G` comes from coreFrom; `today` is YYYY-MM-DD; `at.label` is the default source label
 * (the markdown path) and `at.src` where the viewer can fetch the markdown (?src=), a URL or a path relative to `host`.
 */
export const card = (G, md, prefs, today, at, host = AGILE_HOST) => {
  const doc = G.parse(md);
  const sched = G.schedule(doc);
  const tasks = G.tasksOf(doc);
  const day = G.dayFromIso(today);
  const status = tasks.map((t) => statusOf(t, sched.get(t.id), day));
  const count = (id) => status.filter((x) => x === id).length;
  const conflicts = tasks.filter((t) => sched.get(t.id).conflict).length;
  const items = prefs.legend ?? STATUSES.map((id) => ({ id }));
  const legend = items.filter((l) => !prefs.hideZero || count(l.id) > 0)
    .map((l) => ({ id: l.id, label: l.label ?? DEFAULT_LABELS[l.id], color: l.color ?? DEFAULT_COLORS[l.id] }));
  const spans = [...sched.values()];
  const span = spans.length === 0 ? '' : `${G.isoFromDay(Math.min(...spans.map((s) => s.start)))} → ${G.isoFromDay(Math.max(...spans.map((s) => s.end)))}`;
  const primary = prefs.heading?.primary ?? 'total';
  const late = count('late');
  const title = doc.items.find((i) => i.kind === 'title');
  return {
    version: 1,
    title: prefs.title ?? title?.text ?? 'Plan',
    subtitle: prefs.subtitle ?? span,
    status: conflicts > 0 ? { label: `${conflicts} conflict${conflicts === 1 ? '' : 's'}`, tone: 'bad' }
      : late > 0 ? { label: `${late} late`, tone: 'warn' }
      : { label: 'On track', tone: 'good' },
    heading: { primary: String(primary === 'total' ? tasks.length : count(primary)), label: prefs.heading?.label ?? 'tasks' },
    legend,
    report: Object.fromEntries(legend.map((l) => [l.id, count(l.id)])),
    source: { label: prefs.source?.label ?? at.label, url: `${host}?src=${encodeURIComponent(at.src).replace(/%2F/gi, '/').replace(/%3A/gi, ':')}` },
    updated: today,
  };
};

/* Width estimate for 11px Verdana, as shields.io badges use: ~7px a character, emoji a little wider. */
const width = (t) => [...t].reduce((w, ch) => w + (/\p{Extended_Pictographic}/u.test(ch) ? 14 : 7), 0) + 12;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A shields-style badge: a grey title segment, then "<label> <n>" per legend item with a non-zero count, on its colour. */
export const badgeSvg = (c) => {
  const items = c.legend.map((l) => ({ ...l, n: c.report[l.id] ?? 0 })).filter((l) => l.n > 0);
  const parts = [{ text: c.title, bg: '#555' }, ...items.map((l) => ({ text: `${l.label} ${l.n}`, bg: l.color ?? '#6B7280' }))];
  let x = 0;
  const segs = parts.map((p) => {
    const w = width(p.text);
    const seg = `<rect x="${x}" width="${w}" height="20" fill="${esc(p.bg)}"/><text x="${x + w / 2}" y="14" fill="#fff">${esc(p.text)}</text>`;
    x += w;
    return seg;
  });
  const label = esc(`${c.title}: ${items.length === 0 ? 'no tasks' : items.map((l) => `${l.n} ${l.label.toLowerCase()}`).join(', ')}`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="20" role="img" aria-label="${label}">`,
    `<title>${label}</title>`,
    `<clipPath id="r"><rect width="${x}" height="20" rx="3"/></clipPath>`,
    `<g clip-path="url(#r)" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">`,
    ...segs,
    '</g>',
    '</svg>',
    '',
  ].join('\n');
};
