PORT ?= 8000

.PHONY: dev test dist publish bump-patch bump-minor bump-major

test:
	npm test

# Serves the chart with the repo's markdown beside it (see bin/agile.mjs); File → Save writes .md files back.
dev:
	@PORT=$(PORT) NO_OPEN=1 node bin/agile.mjs examples/acme-roadmap/ROADMAP.md

# Packs the `agile` CLI into pritzlaff-agile-<version>.tgz (install with: npm i -D ./pritzlaff-agile-*.tgz)
dist: test
	npm pack

# Bumps package.json, commits and tags v<version> (needs a clean tree)
bump-patch bump-minor bump-major:
	npm version $(@:bump-%=%)

# Publishes @pritzlaff/agile to npm. Bump first: make bump-patch|bump-minor|bump-major
publish: test
	npm publish
