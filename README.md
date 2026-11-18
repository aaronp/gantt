# Gantt

**[▶ Open the chart](https://aaronp.github.io/gantt/)** ·
[Acme example](https://aaronp.github.io/gantt/?src=examples/acme-roadmap/ROADMAP.md)

A Gantt chart driven by **one markdown file**. Tasks are ordinary list items
with a few attributes, and everything else in the file is kept as written.
Drag a bar to move it, drag its right edge to change its duration, drag ⋮⋮ to
reorder, and pin a task to a date. Each edit is written straight back into the
markdown shown alongside the chart.

This repo is the viewer. Your plan can live in its own repo and be loaded with
`?src=` (see [Publishing your own plan](#publishing-your-own-plan)).

## The file format

The full format, with a minimal and a complete example, is in
**[spec.md](spec.md)**. In short:

```markdown
# Atlas mobile app — v2 launch

## Design
- [ ] Wireframes `id:wire` `start:2026-10-26` `dur:5d`
- [ ] Visual design `id:visual` `after:wire+1d` `dur:6d`
- Launch `id:launch` `after:visual` `dur:0d`
```

A task needs an `id`, a `dur`, and either a fixed `start` date, `after:` the
tasks whose **end** it follows, or `with:` the tasks whose **start** it follows.
`dur:0d` is a milestone. Tasks can also carry `tags:` and named links such as
`[Figma](https://…)`.

## Query parameters

| Query | Values |
| --- | --- |
| `src` | The plan to load: absolute, or relative to the page. Without it, a blank plan is shown. |
| `theme` | `paper` (default), `night`, `blueprint`, `warm`. It also remembers your last choice in the browser. |
| `zoom` | `day` (default) or `week` |
| `view` | `split` (default: chart and markdown) or `chart` |
| `q` | Filter text: tasks whose name, id, section or tags match stay bright and the rest are dimmed |
| `tags` | Comma-separated tags: tasks carrying any of them stay bright (the **Tags** dropdown in the header) |
| `task` | A task id: selects it and opens its inspector |
| `today` | `YYYY-MM-DD`: draws "today" on that date instead of the real one |

The address bar follows along as you change these, so you can copy it to share
the current view.

Sources on another host must allow CORS. GitHub Pages and
`raw.githubusercontent.com` do.

The **File** menu in the header has **New**, which starts a fresh plan (asking
first if you have unsaved edits), **Open**, which loads another plan (drop a `.md`
file, choose one, or enter a URL; a URL stays in the address bar as `?src=`),
**Download**, which saves the markdown file, and
**Copy link**, which copies a link with the whole plan compressed into its `#md=`
hash (it warns when the link is over 2,048 characters, which some apps cut off).
**Save** keeps the plan in this browser under a name you choose; reopen it from
**Open** → *Saved in this browser*, where saves can also be deleted. The badge in
the header tells you whether the chart has changes that aren't saved anywhere
yet. Browser saves stay on this device; download the file to keep it in git.

## Viewing locally

```sh
make dev    # serves on http://localhost:8000/ and prints the example's URL
```

Some browsers block the scripts over `file://`, so serve the folder.
When the chart is served by `make dev` or the `agile` CLI, **File → Save to ROADMAP.md**
writes your edits straight back to the file.

## The `agile` CLI

```sh
bunx @pritzlaff/agile ROADMAP.md   # or npx; no install needed
```

It serves the chart and that file on localhost and opens the browser. Other `.md`
files under the current directory can be opened with `?src=` too. **File → Save** writes
the plan back to disk. `PORT=8000` fixes the port; `NO_OPEN=1` skips opening a browser.
The package has no dependencies: it is `bin/agile.mjs` plus the page itself.

### Card and badge

```sh
agile card ROADMAP.md [out-dir]    # → card.json: the plan as a dashboard card (data only)
agile badge ROADMAP.md [out-dir]   # → badge.svg: drawn from the same card
```

`card.json` (version 1) has a title (the plan's), a subtitle (its date span), a status pill
(`N conflicts`, else `N late`, else `On track`), a big number (tasks), a legend with a count per
status, and a link to the plan. A task is **done** when ticked (or, without a checkbox,
once its end has passed), **late** when open past its end, **in progress** while today is
inside it, and **upcoming** otherwise.

What the card says (titles, legend labels, colours, order) comes from an optional
`ROADMAP.card.json` beside the markdown. Design one with **File → Design card…**
(`card.html?src=…`), which previews the card and badge and downloads the file, or saves it
beside the plan when served by the CLI. The link opens the chart at `AGILE_HOST` (default
`https://aaronp.github.io/gantt/`) on `AGILE_SRC` (where your published markdown lives); set both
as environment variables. The Pages workflow here regenerates the Acme example's files on every
push, so a README can embed the live badge:

```md
[![Plan](https://you.github.io/your-plan/badge.svg)](https://you.github.io/your-plan/)
```

### Adding it to your Bun project

```sh
bun add -d @pritzlaff/agile
bun pm pkg set scripts.plan="agile plan/ROADMAP.md"
mkdir -p plan && echo '- Launch `id:launch` `start:2026-12-14` `dur:3d`' > plan/ROADMAP.md
bun run plan
```

[examples/bun-app](examples/bun-app) is this setup end to end, including a Pages workflow that
publishes `plan/` with its badge and card.

### Releasing

```sh
make bump-patch   # or bump-minor / bump-major: npm version, which commits and tags (clean tree needed)
make publish      # tests, then npm publish
make dist         # tests, then packs the same thing into a local .tgz
```

## Hosting

`.github/workflows/pages.yml` publishes the repo to GitHub Pages on pushes to
`main` or `master` (Settings → Pages → Source: **GitHub Actions**; the
`github-pages` environment must allow your branch). There is no build step.
`.md` files are served raw, without Jekyll.

## Publishing your own plan

Your plan lives in its own data-only repo (`ROADMAP.md`, a redirecting
`index.html` and a Pages workflow); this repo stays the viewer. Create an empty
repo on GitHub, then either:

**A. Start from `examples/` in this repo**

```sh
git clone https://github.com/aaronp/gantt.git
cd gantt/examples/acme-roadmap
make clone REPO=you/your-plan    # or ./clone.sh to be prompted
```

This copies the example to `../your-plan` as a fresh repo on `main`, points its
README link at `https://you.github.io/your-plan/` and sets the `origin` remote.

**B. Clone the standalone example**

```sh
git clone https://github.com/aaronp/gantt-example.git your-plan
cd your-plan
git remote set-url origin git@github.com:you/your-plan.git
```

Then change the **View** link in its README to `https://you.github.io/your-plan/`.

Either way, edit `ROADMAP.md`, commit and `git push -u origin main`, then on
GitHub set Settings → Pages → Source: **GitHub Actions**. Your site at
`https://you.github.io/your-plan/` redirects here with `?src=` pointing at your
`ROADMAP.md`, passing on any other query params.

## Files

- `index.html`: the page. It holds an `<x-dc>` template, its logic class (the
  parser, scheduler and edit operations are the pure `G` module at its top), and
  the loader that fetches `?src=` before booting.
- `support.js`, `vendor/react*.js`: the runtime that renders the component.
- `examples/acme-roadmap/`: a cloneable data-only repo that points back here.
- `examples/bun-app/`: a Bun project with its own `plan/ROADMAP.md`: `bun run plan` opens it locally, Pages publishes it.
- `card.js`: `card.json` and the badge, shared by the CLI and `card.html` (the card designer). It reads plans with the page's own parser, cut out of `index.html`.
- `bin/agile.mjs`: the CLI (local server with save, `card`, `badge`).
- `spec.md`: the markdown format.
