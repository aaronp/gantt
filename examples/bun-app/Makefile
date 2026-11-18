# Where the published ROADMAP.md lives. Pages serves plan/ at the site root, so for the GitHub repo
# you/your-app that is https://you.github.io/your-app/ROADMAP.md (worked out from the origin remote).
# The card's link opens the viewer with ?src= pointing here. Override: make snapshot AGILE_SRC=<url>
AGILE_SRC ?= $(shell git remote get-url origin 2>/dev/null | sed -nE 's|^.*github\.com[:/]([^/]+)/([^/]+)$$|https://\1.github.io/\2/ROADMAP.md|p' | sed 's|\.git/ROADMAP|/ROADMAP|')

.PHONY: snapshot
# Regenerates plan/badge.svg and plan/card.json from plan/ROADMAP.md (and plan/ROADMAP.card.json, if present).
snapshot:
	AGILE_SRC=$(AGILE_SRC) bunx agile badge plan/ROADMAP.md
	AGILE_SRC=$(AGILE_SRC) bunx agile card plan/ROADMAP.md
