# Development setup

The `setup.ts` script located here will take you through an interactive setup process to get your development environment ready. `setup_db.sh` is a script that will create a local PostgreSQL database for you and fill it with some data.

## Prerequisites

1. [Node.js](https://nodejs.org/)
2. [pnpm](https://pnpm.io/)
3. [Docker](https://www.docker.com/) (recommended, but not required)

## Usage

1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm run setup-dev` and follow the interactive steps.

## What does it do?

It guides you in setting up a local PostgreSQL database and creates a `.env.local` file with the correct values for your local environment.
