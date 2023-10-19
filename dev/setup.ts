import { intro, outro, isCancel, text, confirm, select, group } from "@clack/prompts";
import crypto from "crypto";
import { writeFile } from "fs/promises";
import {
  ENV_FILE_PATH,
  POSTGRES_DOCKER_COMMAND,
  POSTGRES_DOCKER_URL,
  POSTGRES_URL_REGEX,
  spin,
  fileExists,
  handleCancellation,
  onCancel,
  runWithSpinner,
} from "./utils";

intro("Let's get you set up!");

const database = await select({
  message: "What should be used to setup a local PostgreSQL database?",
  options: [
    { value: "docker", label: "Docker", hint: "Recommended" },
    { value: "install", label: "Local install", hint: "Manual" },
    { value: "skip", label: "Skip", hint: "You'll need to provide a database yourself" },
  ],
  initialValue: "docker",
});
handleCancellation(database);

let databaseUrl: string | symbol = POSTGRES_DOCKER_URL;
switch (database) {
  case "docker":
    await runWithSpinner(
      POSTGRES_DOCKER_COMMAND,
      "Setting up PostgreSQL",
      "PostgreSQL setup complete!"
    );
    break;
  case "install":
    console.log(
      "\nPlease install PostgreSQL yourself.\nThere is a guide over at https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database"
    );
  // Fall through - prompt for database URL unless Docker is used
  case "skip":
    databaseUrl = await text({
      message: "What is the URL to your PostgreSQL database?",
      placeholder: "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA",
      validate: (value) => {
        if (POSTGRES_URL_REGEX.test(value)) return;
        return "Please provide a valid PostgreSQL URL";
      },
    });
    handleCancellation(databaseUrl);
}

const setup = await group(
  {
    migrate: () =>
      confirm({
        message: "Do you want to run database migrations?",
      }),
    seed: () =>
      confirm({
        message: "Do you want to seed the database with some data?",
      }),
    authSecret: () =>
      text({
        message: "Choose a secret value (minimum 32 characters)",
        initialValue: crypto.randomBytes(32 / 2).toString("hex"),
      }),
    keycloakClientSecret: () =>
      text({
        message: "Set the keycloak client secret",
        initialValue: "secret",
      }),
  },
  {
    onCancel,
  }
);

if (setup.migrate) {
  await runWithSpinner("pnpm migrate", "Running database migrations", "Migrations complete!");
}

if (setup.seed) {
  await runWithSpinner("pnpm seed", "Seeding database", "Seeding complete!");
}

let writeEnv: boolean | symbol = true;
if (await fileExists(ENV_FILE_PATH)) {
  writeEnv = await confirm({
    message: "Do you want to overwrite the existing .env.local file?",
  });
  if (isCancel(writeEnv)) onCancel();
}

if (writeEnv) {
  spin.start("Writing environment variables to .env.local");
  await writeFile(
    ENV_FILE_PATH,
    `DATABASE_URL=${String(databaseUrl)}\nAUTH_SECRET=${setup.authSecret}\nKEYCLOAK_CLIENT_SECRET=${
      setup.keycloakClientSecret
    }`
  );
  spin.stop("Environment variables written!");
} else {
  console.log("\nIn that case, please set the following values manually in the .env.local file:");
  console.log(`DATABASE_URL=${String(databaseUrl)}`);
  console.log(`AUTH_SECRET=${setup.authSecret}`);
  console.log(`KEYCLOAK_CLIENT_SECRET=${setup.keycloakClientSecret}`);
}

outro(`You're all set! Run 'pnpm dev' to start the server.`);
