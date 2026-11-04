# Development setup

The `setup.ts` script located here will take you through an interactive setup process to get your development environment ready. `setup_db.sh` is a script that will create a local PostgreSQL database for you and fill it with some data.

## Prerequisites

1. [Node.js](https://nodejs.org/) 24 (`nvm use` picks it up from `.nvmrc`)
2. [pnpm](https://pnpm.io/) 12
3. [Docker](https://www.docker.com/) (recommended, but not required)

## Usage

1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm run setup-dev` and follow the interactive steps.

## What does it do?

It guides you in setting up a local PostgreSQL database and creates a `.env.local` file with the correct values for your local environment.

## Integration tests

These run the production build in a browser against a real database, with Authentik and the ticket service replaced by a fake (`tests/e2e/fake-oidc.mjs`), so they can log in without an account. They need a migrated and seeded database, and clean up after their own test users.

```sh
pnpm exec playwright install --only-shell chromium # once, and after Playwright updates
pnpm build
pnpm test:integration
```

Rebuild after changing code, as they don't use the dev server.
