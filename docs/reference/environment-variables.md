# Environment variables

An environment variable is a dynamic value that can affect the way running processes behave on a computer. They are mainly used to provide secret values that we don't want to be publicly available in the source code. This page describes the environment variables used in the web repo.

## Database

Prisma uses the following environment variables to connect to the database. You can suffix the POSTGRES_URL with `&connection_limit=5` to specify the maximum number of connections in the connection pool. Read more about the connection pool [here](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool#connection-pool-size).

```bash
POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/dsek?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/dsek?schema=public"
```

## Auth

Auth.js uses the following environment variables. `AUTH_SECRET` is required and should be at least a 32 character long random string. `AUTH_TRUST_HOST` should be set to `true` if the server is behind a reverse proxy.
`KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_ISSUER` are used for the Keycloak integration.
Read more about [Auth.js variables](https://authjs.dev/getting-started/deployment) and [Keycloak adapter variables](https://authjs.dev/getting-started/providers/keycloak).

```bash
AUTH_SECRET="4e0b5eed97d12748be91415ac2716b9e91deb57198c7b3662afe7f1649089b54"
KEYCLOAK_CLIENT_SECRET="secret"
AUTH_TRUST_HOST=true
KEYCLOAK_CLIENT_ID="dsek-se-openid"
KEYCLOAK_CLIENT_ISSUER="https://portal.dsek.se/realms/dsek"
```

## Keycloak

Keycloak stores user's roles and permissions based on the positions they are assigned on the webpage (i.e dsek.aktu.dsportare). The following environment variables are used to connect to the Keycloak server to keep the roles and permissions in sync with the webpage. This sync can be disabled by setting `KEYCLOAK_ENABLED` to `false` for development purposes.

```bash
KEYCLOAK_ADMIN_USERNAME="<USERNAME>"
KEYCLOAK_ADMIN_PASSWORD="<PASSWORD>"
KEYCLOAK_ENDPOINT=https://portal.dsek.se
KEYCLOAK_ENABLED=false
```

## File storage

MinIO is a file server that is used to store files and documents. The following environment variables are used to connect to the MinIO server. Different types of files are stored in different buckets.

```bash
MINIO_ROOT_USER="<USERNAME>"
MINIO_ROOT_PASSWORD="<PASSWORD>"
PUBLIC_MINIO_ENDPOINT=minio.api.sandbox.dsek.se
PUBLIC_MINIO_PORT=443
PUBLIC_MINIO_USE_SSL=true

PUBLIC_BUCKETS_DOCUMENTS="documents"
PUBLIC_BUCKETS_FILES="files"
PUBLIC_BUCKETS_MEMBERS="members"
```

## Yrka

Yrka is a service that allows users to submit "yrkanden" during meetings. The following environment variables are used to send emails.

```bash
EMAIL_YRKA_USER="<EMAIL>"
EMAIL_YRKA_PASS="<PASSWORD>"
```

## Link shortener

Shlink is a URL shortener that is used to create short links. The following environment variables are used to connect to the Shlink server.

```bash
SHLINK_API_KEY="<API_KEY>"
SHLINK_ENDPOINT=https://link.dsek.se
```

## Payments

Stripe is a payment provider that is used to handle payments. The following environment variables are used to connect to the Stripe server.

If `PUBLIC_PURCHASE_PASS_ON_TRANSACTION_FEE` is set to `true`, the transaction fee will be added to the cart so the resulting net for us is the tickets price. If it's `false`, nothing will be changed and our net is less than the ticket's price.

```bash
PUBLIC_STRIPE_KEY=pk_test_...
SECRET_STRIPE_KEY=sk_test_...
SECRET_STRIPE_WEBHOOK_SIGNING=whsec_...
PUBLIC_PURCHASE_PASS_ON_TRANSACTION_FEE=false
```

## Miscellanous

- `PUBLIC_VERCEL_ENV` is set when the app is deployed on Vercel.
- `MOCK_IS_APP` will pretend like all traffic is coming from the app to test how custom app design looks.
- `REQUEST_LOGGING` will log all requests to the console in production.
- `PRISMA_LOG_LEVEL` can be set to either `silent`, `writes` or `all`. It logs database queries to the console.
