# Acme — roadmap

**[▶ View the roadmap](https://aaronp.github.io/gantt-example/)**

The plan lives in [`ROADMAP.md`](ROADMAP.md). The Gantt chart comes from
[aaronp/gantt](https://github.com/aaronp/gantt); the format is described in its
[spec.md](https://github.com/aaronp/gantt/blob/main/spec.md).

## Using this as a template

1. Create an empty repo on GitHub, then from this directory run
   `make clone REPO=you/your-repo` (or `./clone.sh`, which prompts).
   It copies the files to `../your-repo`, points the View link above at
   your Pages site and sets the git remote.
2. Edit `ROADMAP.md` (or edit it in the chart and copy the markdown back),
   then commit and push.
3. On GitHub: Settings → Pages → Source: **GitHub Actions**.
4. Optional: on the repo page, open About (⚙) → tick **Use your GitHub Pages
   website** so the link also shows in the sidebar.

The workflow deploys from `main` or `master`. "Branch … is not allowed to
deploy to github-pages"? Add your branch under Settings → Environments →
github-pages → Deployment branches and tags.

Your site redirects to the chart with `?src=` pointing at your `ROADMAP.md`.
Any query params you add are passed on, e.g. `?theme=night&zoom=week`.

No Pages? Link straight to the raw file:
`https://aaronp.github.io/gantt/?src=https://raw.githubusercontent.com/<you>/<repo>/<branch>/ROADMAP.md`
