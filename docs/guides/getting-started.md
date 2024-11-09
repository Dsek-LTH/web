# How to get started

Follow the steps below to get a local development environment up and running.

## Prerequisites

Before you can start developing, you need to install the following tools:

::: details Are you using Windows?
If you're running Windows, it's highly recommended to [first install **WSL**](https://learn.microsoft.com/en-us/windows/wsl/install). This sets up a Linux environment on your Windows machine and simplifies development.

When you have WSL installed, you can open a WSL terminal and follow the instructions below as if you were using Linux normally.
:::

1. Install [Node.js](https://nodejs.org/en/download/).

   Using **nvm** to install Node.js is _strongly recommended_.

   The installation steps are provided below for reference, but for up-to-date instructions, visit the link above.
   Open a terminal and run the following commands:

   ```bash
   # installs nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   # download and install Node.js (you may need to restart the terminal)
   nvm install 20
   # verifies the right Node.js version is in the environment
   node -v # should print `v20.18.0`
   # verifies the right npm version is in the environment
   npm -v # should print `10.8.2`
   ```

2. Install [pnpm](https://pnpm.io/installation#using-corepack).

   Now, install the package manager pnpm. Installing pnpm using **Corepack** is _strongly recommended_.

   ```bash
   corepack enable pnpm
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
2. Install all dependencies using `pnpm`. [Having problems?](#node-js-permissions-issues)
   ```bash
   pnpm install
   ```
3. Setup your local development database. [Having problems?](#database-setup-issues)

   ```bash
   ./dev/setup_db.sh
   ```

4. Start the development server.

   ```bash
   pnpm dev
   ```

5. Congratulations! You should now be able to visit your application on [http://localhost:5173](http://localhost:5173).

## Troubleshooting

### Node.js permissions issues

If you encounter permission issues when running the `pnpm install` command, you may have installed Node.js using `sudo`. This can cause permission issues when installing packages. To fix this, we recommend uninstalling Node.js completely and reinstalling it without `sudo` using `nvm`.

### Database setup issues

Issues commonly occur when setting up the local development database. Usually, this shows up either as errors when running `./dev/setup_db.sh` or as simply not seeing any data when the development server starts. Here are some steps you can try to fix the problem:

1. Begin by deleting the local database. Open Docker Desktop and delete `dsek-db` (or use the command below).

   ```bash title="Docker CLI (alternative)"
   docker rm --force dsek-db
   ```

2. If you noticed permission errors while running `./dev/setup_db.sh`, try running the script using `sudo`.

   ```bash
   sudo ./dev/setup_db.sh
   ```

3. Finally, you can always try to run the commands in the `./dev/setup_db.sh` script manually. This makes it easier to troubleshoot what's going on. Open a terminal and run the commands below one-by-one.

   ::: info
   Some commands span multiple lines! Backslashes `\` are used to break a command into multiple lines. These commands must be copied in their entirety instead of line-by-line.
   :::

   <<< @/../dev/setup_db.sh
