# Nice to have commands

## Setup localling

### install dependencies

```sh
pnpm install
```

### Setting up DB (if you don't already have one)

```bash
docker run --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=new_web -d postgres:14-alpine
```

### Setup `.env.local`
- Override `DATABASE_URL`
- Insert `AUTH_SECRET` from someone or generate with `openssl rand -hex 32`
- Insert `KEYCLOAK_CLIENT_SECRET` (secret)

### migrate local db to latest (or create prisma new migration)

```sh
pnpm migrate
```

### seed database

```sh
pnpm seed
```

### generate (should automatically be done )

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
