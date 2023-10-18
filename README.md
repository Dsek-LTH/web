# Nice to have commands

## Setup localling

### install dependencies

```sh
pnpm install
```

### Setup `.env.local`

- Override `DATABASE_URL`
- Insert `AUTH_SECRET` from someone or generate with `openssl rand -hex 32`
- Insert `KEYCLOAK_CLIENT_SECRET` (secret)

## Set up DB and Prisma

### Create a local database

We use PostgreSQL 14. Use whatever method you like to do this, below is an example script you can run (all you need is docker) to setup a database called "new_web" on port 5432.

```bash
docker run --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=new_web -d postgres:14-alpine
```

### Import old prod database

1. The following command will setup the schema for the "old" database in your database, this is required to migrate over data.

```sh
pnpm prisma db execute --file primsa/migrations/0_init/migration.sql
pnpm prisma migrate resolve --applied 0_init
```

2. Set `session_replication_role` to `'replica'`, this will temporarily disable all foreign key checks. If you used the parameters for your postgresql docker container above the following command should work.

```sh
docker exec -it postgres psql -U postgres --dbname=new_web --command="SET session_replication_role = 'replica';"
```

3. Get a dump of the old database, data-only, and make sure to "sanitize" in the following ways:

   - do not insert "type" into authors, this is a generated field.

   Easiest is to get a pre-sanitized database dump from someone in DWWW.

   Then import the dump into your database.

```sh
cat dsek_prod_dump.sql | docker exec -it postgres psql -U postgres --dbname=new_web
```

4. Re-enable foreign key checks.

```sh
docker exec -it postgres psql -U postgres --dbname=new_web --command="SET session_replication_role = 'origin';"
```

5. Run the other migrations

```sh
pnpm prisma migrate dev
```

6. You are now up-to-date

### Alternative: Start with an empty database

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
