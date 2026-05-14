# Devcontainer

This directory supports running a full developer environment in containers with either Docker or Podman. It integrates with VSCode thrugh the Dev Containers extension.

1. [`Containerfile`](./Containerfile) builds an execution environment for the node app.
1. [`compose.yaml`](./compose.yaml) starts the app and database container. Can be used directly with `podman/docker compose up`.
1. [`devcontainer.json`](./devcontainer.json) will be automatically detected by VSCode, prompting you to "Reopen in Container". Can also work with other environments that understand the devcontainer standard.

Choose whichever workflow fits your setup.
