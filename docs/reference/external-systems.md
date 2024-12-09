---
outline: deep
---

# External systems

### Postgres

Postgres is the database used by the application. It is hosted on the same machine as the web server. Prisma is used to interact with the database.

### Keycloak

Keycloak is used for authentication. It has its own database of users and roles, and provides an OpenID Connect endpoint for the application to authenticate users. Auth.js is used to interact with Keycloak for authentication and Keycloak Admin Client is used to interact with Keycloak's admin API (for syncing users and their roles).

**FreeIPA**: FreeIPA is not used directly by the application, but it is also used to manage users and roles. Keycloak is synced with FreeIPA to keep the two systems in sync.

### Shlink

Shlink is used to create short links. We provide an interface for members to create short links easily. The application interacts behind the scenes with Shlink through its API.

### MinIO

MinIO is used to store files like profile pictures and meeting documents.

### Meilisearch

Meilisearch is used to provide a good search experience. It can index data from our database and provide rich search capabilities.
