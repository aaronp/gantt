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
| `src` | The plan to load: absolute, or relative to the page. Without it, the built-in sample is shown. |
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

**Open** in the header loads another plan: drop a `.md` file, choose one, or
enter a URL. A URL stays in the address bar as `?src=`.
Beside it, **New** starts a fresh plan (asking first if you have unsaved
edits), **Copy** puts the markdown on the clipboard, and **Download** saves it.
**Save** keeps the plan in this browser under a name you choose; reopen it from
**Open** → *Saved in this browser*, where saves can also be deleted. The badge in
the header tells you whether the chart has changes that aren't saved anywhere
yet. Browser saves stay on this device; download the file to keep it in git.

## Viewing locally

```sh
make dev    # serves with Bun on http://localhost:8000/ and prints the example's URL
```

Some browsers block the scripts over `file://`, so serve the folder.

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
- `spec.md`: the markdown format.
