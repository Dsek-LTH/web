---
outline: deep
---

# Getting started

Follow the steps below to get a local development enviornment up and running.

## Prerequisites

Before you can start developing, you need to install the following tools:

::: details Are you using Windows?
If you're running Windows, it's highly recommended to [first install **WSL**](https://learn.microsoft.com/en-us/windows/wsl/install). This sets up a Linux environment on your Windows machine and simplifies development.

When you have WSL installed, you can open a WSL terminal and follow the instructions below as if you were using a Linux distribution.
:::

1. Head over to the [installation page for **Node.js**](https://nodejs.org/en/download/). Install Node.js LTS. Using nvm is recommended, but not required.

   When the installation is complete, open a terminal and verify that Node.js is installed by running the following command:

   ```bash
   node -v
   ```

   It should output the version of Node.js you installed _(your version may be different)_.

   ```bash
   v20.17.0
   ```

2. Now, [install the package manager **pnpm**](https://pnpm.io/installation#using-corepack). Installing pnpm using Corepack is strongly recommended.

   When the installation is complete, open a terminal and ensure pnpm works as expected by running the following command:

   ```bash
   pnpm -v
   ```

   It should output the version of pnpm you installed _(your version may be different)_.

   ```bash
   9.7.1
   ```

3. Finally, [install **Docker Desktop**](https://docs.docker.com/get-docker/). Docker Desktop is a graphical interface for Docker. Docker is not strictly required for development, but it simplifies setting up a development database.

   When the installation is complete, open a terminal and verify that Docker is installed by running the following command:

   ```bash
   docker -v
   ```

   It should output the version of Docker you installed _(your version may be different)_.

   ```bash
   Docker version 20.10.17, build 100c701
   ```

## Setting up the project

1. Clone the repo into `dsek-web` and change into the directory.
   ```bash
   git clone https://github.com/Dsek-LTH/web.git dsek-web && cd dsek-web
   ```
2. Install all dependencies using `pnpm`.
   ```bash
   pnpm install
   ```
3. Setup your local development database. [Having problems?](#troubleshooting)

   ```bash
   sh ./dev/setup_db.sh
   ```

4. Start the development server.

   ```bash
   pnpm dev
   ```

5. Congratulations! You should now be able to visit your application on [http://localhost:5173](http://localhost:5173).

## Troubleshooting

Issues commonly occur when setting up the local development database. Usually, this shows up either as errors when running `sh ./dev/setup_db.sh` or as simply not seeing any data when the development server starts. Here are some steps you can try to fix the problem:

1. Begin by deleting the local database. Open Docker Desktop and delete `dsek-db` (or use the command below).

   ```bash title="Docker CLI (alternative)"
   docker rm --force dsek-db
   ```

2. Option 1: If you noticed permission errors while running `sh ./dev/setup_db.sh`, try running the script using `sudo`.

   ```bash
   sudo sh ./dev/setup_db.sh
   ```

3. Option 2: You can always try to run the commands in the script manually. This makes it easier to troubleshoot what's going on. Open a terminal and run the commands one-by-one.

   Note that some commands span multiple lines! Backslashes `\` are used to break a command into multiple lines.

   <<< @/../dev/setup_db.sh
