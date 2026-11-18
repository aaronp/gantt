PORT ?= 8000

.PHONY: dev test dist publish bump-patch bump-minor bump-major

test:
	npm test

# Serves the chart with the repo's markdown beside it (see bin/gantt.mjs); File → Save writes .md files back.
dev:
	@PORT=$(PORT) NO_OPEN=1 node bin/gantt.mjs examples/acme-roadmap/ROADMAP.md

# Packs the `gantt` CLI into pritzlaff-gantt-<version>.tgz (install with: npm i -D ./pritzlaff-gantt-*.tgz)
dist: test
	npm pack

# Bumps package.json, commits and tags v<version> (needs a clean tree)
bump-patch bump-minor bump-major:
	npm version $(@:bump-%=%)

# Publishes @pritzlaff/gantt to npm. Bump first: make bump-patch|bump-minor|bump-major
publish: test
	npm publish
