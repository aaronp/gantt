# Plan file format

A plan is one markdown file, read line by line. A line is one of:

- `# Title`: the plan's title (the first one is shown in the header). It can
  carry display preferences as attributes, e.g.
  ``# Launch plan `theme:night` `view:chart` ``: `theme` is `paper`, `night`,
  `blueprint` or `warm`; `view` is `split` or `chart`. They apply when the
  address bar doesn't set `?theme=` or `?view=`, and picking a theme or view
  writes them back;
- `## Section`: starts a section, which groups the tasks under it;
- a **task**: a list item carrying an `` `id:` `` attribute;
- anything else (notes, blank lines, other lists, `###` headings), which is
  kept exactly as written.

Editing in the chart rewrites only the task lines it changes, so everything
else in the file survives untouched.

## Minimal example

```markdown
- Launch `id:launch` `start:2026-12-14` `dur:3d`
```

One task, fixed to 14 December 2026, three days long. That is a complete plan.

## Full example

```markdown
# Atlas mobile app — v2 launch

Tasks are list items carrying an `id:`. Everything else is kept as written.

## Discovery
- [x] Stakeholder interviews `id:interviews` `start:2026-10-19` `dur:4d`
- [x] Requirements brief `id:brief` `after:interviews` `dur:3d`

## Design
- [ ] Wireframes `id:wire` `after:brief` `dur:1w`
- [ ] Visual design `id:visual` `after:wire+1d` `dur:6d` `tags:ux` [Figma](https://figma.com/file/atlas)
- [ ] Design review `id:review` `start:2026-11-12` `after:visual` `dur:1d`

## Build
- [ ] API endpoints `id:api` `after:brief+2d` `dur:9d` `tags:backend`
- [ ] API docs `id:apidocs` `with:api+3d` `dur:4d` `tags:backend,docs`
  - [ ] Auth service `id:auth` `after:brief` `dur:4d`
- [ ] App screens `id:screens` `after:review,api` `dur:10d`
- Notes from the build kickoff are in the wiki (no `id`, so not a task).

### Risks
Store review times vary; keep a week of slack before launch.

## Launch
- [ ] QA pass `id:qa` `after:screens` `dur:5d`
- [ ] Store submission `id:submit` `after:qa` `dur:2d`
- Public launch `id:launch` `start:2026-12-14` `after:submit` `dur:0d`
```

## Tasks

```markdown
- [ ] Visual design `id:visual` `after:wire+1d` `dur:6d` `tags:ux` [Figma](https://figma.com/file/atlas)
```

- **List marker:** a task starts with `-` or `*`, and may be indented (the
  indentation is kept).
- **Checkbox:** an optional `[ ]` or `[x]` marks the task open or done. Done
  tasks are drawn faded. Without a checkbox the task has no done state.
- **Name:** the text before the first backtick. It can't be empty or contain
  backticks.
- **Attributes:** each is written in backticks, `` `key:value` ``, after the
  name.
- **Links:** after the attributes, any number of named links,
  `[Figma](https://…)`. Nothing else may follow the attributes.

| Attribute | Value | Required |
| --- | --- | --- |
| `id` | Letters, digits, `-` and `_`, starting with a letter or digit. Unique in the file. | yes |
| `dur` | Duration as `3d` (days) or `2w` (weeks). `0d` makes a **milestone**, drawn as a diamond. | yes |
| `start` | A fixed start date, `YYYY-MM-DD`. | one of `start`, `after`, `with` |
| `after` | The task starts when the listed tasks have all **finished**: `after:a`, or `after:a,b`. | one of `start`, `after`, `with` |
| `with` | The task starts when the listed tasks **start**: `with:a`, or `with:a,b`. | one of `start`, `after`, `with` |
| `tags` | Comma-separated labels for filtering: `tags:ux,web`. A tag can't contain backticks or commas. | no |

### Scheduling

Every task is either **relative** or **fixed**.

- **Relative** (`after:` and/or `with:`): it starts at the latest of these
  points: the end of each `after:` task and the start of each `with:` task.
  An offset shifts that: `after:wire+1d` starts a day later, `with:api+3d`
  three days after `api` starts, and `-2d` two days earlier. Offsets take `d` or
  `w`. A task has one offset, written on `after:` or on `with:` (not both).
  A task can't be in both lists.
- **Fixed** (`start:`): it starts on that date. It may also list `after:` and
  `with:` tasks, which are then checked rather than followed. If one of them
  ends (`after:`) or starts (`with:`) after the fixed start, the task is
  flagged as a **conflict**. A fixed task can't have an offset.

Durations and offsets count calendar days; weekends are shaded on the chart
but not skipped. A task ends at the start of the day after its last day, so a
`dur:3d` task starting Monday covers Monday to Wednesday.

## Errors

The file is rejected, with the line number, when a task line can't be used:

- no `` `id:` `` value, or an id that isn't letters, digits, `-` and `_`;
- the same id used twice;
- no `` `dur:` ``, or a span that isn't like `3d` or `2w`, or a negative one;
- none of `` `start:` ``, `` `after:` `` or `` `with:` ``;
- a `start` that isn't a real `YYYY-MM-DD` date;
- an `after:` or `with:` naming an unknown task, or the task itself;
- the same task in both `after:` and `with:`, or an offset on both;
- tasks that depend on each other in a loop (`a` after `b` after `a`);
- an unknown attribute, a repeated attribute, or text after the attributes
  other than `[name](url)` links;
- an offset together with `start:`.

A list item without an `` `id:` `` is never a task, so ordinary bullet lists in
your notes are safe.

## How the chart writes the file

When you edit in the chart, it rewrites the changed task lines in a standard
form:

- **Attribute order:** `id`, `start`, `after`, `with`, `dur`, `tags`, then
  the links. The offset is written on `after:` if there is one, else on
  `with:`.
- **Units:** durations and offsets are written in days, so `dur:1w` becomes
  `dur:7d`.
- **Kept as they were:** the checkbox (or its absence) and the indentation.

Titles, sections and every other line are written back exactly as they were.
Renaming the plan in the header rewrites its first `# ` line, or adds one at the
top.

## Loading a plan

- `?src=<url>` loads a plan: absolute, or relative to the page. Files on
  another site must allow cross-origin requests; GitHub Pages and
  `raw.githubusercontent.com` do.
- **Open** in the header loads a plan by dropping a file, choosing one, or
  entering a URL.
