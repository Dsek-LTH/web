# How to get started

Follow the steps below to get a local development environment up and running.

## Prerequisites

Before you can start developing, you need to install the following tools:

::: details Are you using Windows?
If you're running Windows, it's highly recommended to [first install **WSL**](https://learn.microsoft.com/en-us/windows/wsl/install). This sets up a Linux environment on your Windows machine and simplifies development.

When you have WSL installed, you can open a WSL terminal and follow the instructions below as if you were using Linux normally.
:::

1. Install [Node.JS](https://nodejs.org/en/download/).

   Click on the link above and install Node.js _LTS_. Using _nvm_ is recommended.
   When the installation is complete, open a terminal and verify that Node.js is installed by running the following command:

   ```bash
   node -v
   ```

   It should output the version of Node.js you installed _(your version may be different)_.

   ```bash
   v20.17.0
   ```

2. Install [pnpm](https://pnpm.io/installation#using-corepack).

   Now, install the package manager pnpm. Installing pnpm using Corepack is _strongly recommended_.
   When the installation is complete, open a terminal and ensure pnpm works as expected by running the following command:

   ```bash
   pnpm -v
   ```

   It should output the version of pnpm you installed _(your version may be different)_.

   ```bash
   9.7.1
   ```

3. Install [Docker Desktop](https://docs.docker.com/get-docker/).

   Finally, install Docker by installing the graphical Docker interface Docker Desktop. This is not strictly required for development, but it simplifies setting up a development database. When the installation is complete, open a terminal and verify that Docker is installed by running the following command:

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

2. If you noticed permission errors while running `sh ./dev/setup_db.sh`, try running the script using `sudo`.

   ```bash
   sudo sh ./dev/setup_db.sh
   ```

3. Finally, you can always try to run the commands in the `./dev/setup_db.sh` script manually. This makes it easier to troubleshoot what's going on. Open a terminal and run the commands below one-by-one.

   ::: info
   Some commands span multiple lines! Backslashes `\` are used to break a command into multiple lines. These commands must be copied in their entirety instead of line-by-line.
   :::

   <<< @/../dev/setup_db.sh
