# Nice to have commands

## Setup localling

### install dependencies

```sh
pnpm install
```

### Setup `.env.local`

Copy .env into .env.local

- Override `DATABASE_URL` if you do not use the same names and ports as below
- Insert `KEYCLOAK_CLIENT_SECRET` (secret)
- Insert `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`

## Set up DB and Prisma

### Create a local database

We use PostgreSQL 14. Use whatever method you like to do this, below is an example script you can run (all you need is docker) to setup a database called "dwww_web" on port 5432.

```bash
docker compose up
```

If the above command doesn't work, try this

```bash
docker run --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dwww_web -d postgres:14-alpine
```

### Setup database

The following bash script will setup the database using a big pre-seeded database. Make sure to wait a few seconds to allow the postgres container to start up.

```sh
sh ./setup_db.sh
```

### Alternative: Start with an empty database

---

1. migrate local db to latest (or create prisma new migration)

```sh
pnpm migrate
```

2. seed database

```sh
pnpm seed
```

### Generate (should automatically be done)

```sh
pnpm generate
```

## Other services

### MINIO (File system)

This project uses the minio sandbox instance hosted on our servers, contact an admin to receive an access token

## Developing

Once you've created a project and installed setup everything like above, start a development server:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
