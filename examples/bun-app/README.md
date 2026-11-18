# bun-app — a Bun project with its own plan

A tiny Bun service whose roadmap lives beside the code in
[`plan/ROADMAP.md`](plan/ROADMAP.md).

```sh
bun install
bun run plan     # opens plan/ROADMAP.md in the chart, served from localhost
bun start        # the app itself
```

`bun run plan` uses the [`@pritzlaff/gantt`](https://www.npmjs.com/package/@pritzlaff/gantt)
dev dependency. Edits in the chart are written back with **File → Save to ROADMAP.md**, so
commit the file as usual. Edit it by hand and reload the page to see changes.

No install? `bunx @pritzlaff/gantt plan/ROADMAP.md` does the same.

## Badge and summary card

```sh
make snapshot    # → plan/badge.svg and plan/card.json
```

- `badge.svg` is a status badge for your README:
  `[![Plan](https://you.github.io/your-app/badge.svg)](https://you.github.io/your-app/)`
- `card.json` is the same summary as data (title, status pill, big number, a count per
  status — done, in progress, upcoming, late — and a link) for a dashboard to style as it likes.

To change the title, labels, colours or which statuses show, open the chart (`bun run plan`),
pick **File → Design card…**, then **Save ROADMAP.card.json** (it lands in `plan/`), and run
`make snapshot` again.

The card's link opens the hosted chart on your published `ROADMAP.md`. `make` works out that URL
from your `origin` remote; override it with `make snapshot GANTT_SRC=<url>`, and point it at
another viewer with `GANTT_HOST=<url>` (the same address as `VIEWER` in `plan/index.html`).

## Publishing on GitHub Pages

`.github/workflows/pages.yml` publishes only the `plan/` folder. Its `index.html` redirects to
the hosted chart with `?src=` pointing at your `ROADMAP.md`, as in
[acme-roadmap](../acme-roadmap). It also runs `make snapshot`, so `plan/badge.svg` and
`plan/card.json` are published beside it. On GitHub: Settings → Pages → Source: **GitHub Actions**.
