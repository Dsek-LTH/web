# Repo-wide commands. Each app keeps its own tooling (apps/api: Go and its
# Makefile, apps/web: pnpm); this file runs them from the root. `make`
# alone lists the targets.

API := apps/api
WEB := apps/web
POPPLER := apps/poppler-server

# Tools for the whole repo, versioned in tools/go.mod and built into
# tools/bin (gitignored) whenever it changes. actionlint isn't in there:
# it needs an older version of a YAML library than oasdiff does.
BIN := $(CURDIR)/tools/bin
ACTIONLINT_VERSION := v1.7.12
TOOLS := $(BIN)/.installed

# What make api-diff compares against.
BASE ?= main

.DEFAULT_GOAL := help
.PHONY: help setup db migrate seed db-shell db-reset hooks dev dev-api \
	dev-web generate fmt check lint lint-api lint-web lint-ci test test-api \
	test-web api-types e2e api-diff audit

help: ## List the targets
	@awk 'BEGIN { FS = ":.*## " } \
		/^##@/ { printf "\n%s\n", substr($$0, 5) } \
		/^[a-z-]+:.*## / { printf "  \033[36m%-11s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

$(TOOLS): tools/go.mod tools/go.sum
	cd tools && GOBIN=$(BIN) go install tool
	GOBIN=$(BIN) go install github.com/rhysd/actionlint/cmd/actionlint@$(ACTIONLINT_VERSION)
	@touch $@

##@ Setup

setup: $(TOOLS) ## Install dependencies, Go modules, the tools and Playwright's Chromium
	cd $(WEB) && pnpm install
	cd $(POPPLER) && pnpm install
	cd $(API) && go mod download
	cd $(WEB) && pnpm exec playwright install chromium

db: ## Start Postgres, Meilisearch and poppler, then migrate and seed (wipes the dev data)
	docker compose up -d
	@until docker exec dsek-db pg_isready --quiet; do sleep 0.5; done
	@$(MAKE) --no-print-directory migrate seed

migrate: ## Apply the database migrations
	cd $(API) && go tool migrate up

seed: ## Wipe the dev database and fill it with fake data
	cd $(API) && go tool seed

db-shell: ## psql on the dev database
	docker exec -it dsek-db psql -U postgres dsek

db-reset: ## Drop and recreate the dev database, then migrate and seed
	docker exec dsek-db psql -U postgres -v ON_ERROR_STOP=1 \
		-c "DROP DATABASE IF EXISTS dsek WITH (FORCE)" -c "CREATE DATABASE dsek"
	@$(MAKE) --no-print-directory migrate seed

hooks: $(TOOLS) ## Install the pre-push hook (lefthook.yml)
	$(BIN)/lefthook install

##@ Develop

dev: ## Run the API (:8090, hot reload) and the web app (:5173) together
	@$(MAKE) --no-print-directory -j2 dev-api dev-web

dev-api: ## Run the API with hot reload
	cd $(API) && $(MAKE) dev

dev-web: ## Run the web app's dev server
	cd $(WEB) && pnpm dev

generate: ## sqlc, then the web app's API types: after a query or API change
	cd $(API) && $(MAKE) generate
	cd $(WEB) && pnpm generate:api

fmt: ## Format both apps
	cd $(API) && $(MAKE) format
	cd $(WEB) && pnpm format:fix

##@ Check

check: lint test api-types ## Everything CI checks except the end-to-end tests

lint: lint-api lint-web lint-ci ## All the linters

lint-api: $(TOOLS) ## go vet, golangci-lint, and sqlc's generated code being current
	cd $(API) && go vet ./... && $(BIN)/golangci-lint run ./... && go tool sqlc diff

lint-web: ## eslint, Prettier, svelte-check and the translations
	cd $(WEB) && pnpm lint --max-warnings 0 && pnpm format \
		&& pnpm check --fail-on-warnings && pnpm check-translations

lint-ci: $(TOOLS) ## actionlint on the GitHub workflows
	$(BIN)/actionlint

test: test-api test-web ## The Go and vitest tests

test-api: ## The Go tests (the ones needing Postgres skip without it)
	cd $(API) && go test ./...

test-web: ## The vitest tests
	cd $(WEB) && pnpm test

api-types: ## Fail if the web app's API types are stale
	cd $(WEB) && pnpm generate:api && git diff --exit-code src/lib/api/schema.d.ts

e2e: ## The Playwright tests (see "End-to-end tests" in AGENTS.md)
	cd $(WEB) && pnpm test:integration

api-diff: $(TOOLS) ## Breaking API changes against BASE (default main), as CI checks
	@tmp=$$(mktemp -d) && trap 'rm -rf "$$tmp"' EXIT \
		&& git archive $(BASE) $(API) | tar -x -C "$$tmp" \
		&& if [ ! -d "$$tmp/$(API)/cmd/openapi" ]; then \
			echo "$(BASE) has no $(API)/cmd/openapi to compare with"; exit 1; fi \
		&& (cd "$$tmp/$(API)" && go run ./cmd/openapi -3.0) > "$$tmp/base.json" \
		&& (cd $(API) && go run ./cmd/openapi -3.0) > "$$tmp/head.json" \
		&& $(BIN)/oasdiff breaking "$$tmp/base.json" "$$tmp/head.json" --fail-on ERR

audit: $(TOOLS) ## Known vulnerabilities: govulncheck, and pnpm audit for both Node apps
	@status=0; \
		(cd $(API) && $(BIN)/govulncheck ./...) || status=1; \
		(cd $(WEB) && pnpm audit) || status=1; \
		(cd $(POPPLER) && pnpm audit) || status=1; \
		exit $$status
