import { confirm, group, intro, outro, select, text } from "@clack/prompts";
import {
  envFileExists,
  generateSecret,
  handleCancellation,
  onCancel,
  POSTGRES_DOCKER_URL,
  runWithSpinner,
  setupDatabase,
  spin,
  validateDbUrl,
  writeEnvFile,
} from "./utils";

intro("Let's get you set up!");

let databaseUrl: string | symbol = POSTGRES_DOCKER_URL;
const database = await select({
  message: "What should be used to setup a local PostgreSQL database?",
  options: [
    { value: "docker", label: "Docker", hint: "Recommended" },
    { value: "install", label: "Local install", hint: "Manual" },
    {
      value: "skip",
      label: "Skip",
      hint: "You'll need to provide a database yourself",
    },
  ],
  initialValue: "docker",
});
handleCancellation(database);

switch (database) {
  case "docker":
    await setupDatabase();
    break;
  case "install":
    console.log(
      "\nPlease install PostgreSQL yourself before continuing.\nThere is a guide over at https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database",
    );
  // Fall through - prompt for database URL if user choose to install or skip
  case "skip":
    databaseUrl = await text({
      message: "What is the URL to your PostgreSQL database?",
      placeholder:
        "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA",
      validate: validateDbUrl,
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
        initialValue: generateSecret(),
      }),
    keycloakClientSecret: () =>
      text({
        message: "Set the keycloak client secret (can be left as 'secret')",
        initialValue: "secret",
      }),
  },
  { onCancel },
);

if (setup.migrate) {
  await runWithSpinner(
    "pnpm migrate",
    "Running database migrations",
    "Migrations complete!",
  );
}

if (setup.seed) {
  await runWithSpinner("pnpm seed", "Seeding database", "Seeding complete!");
}

let writeEnv: boolean | symbol = true;
if (await envFileExists()) {
  writeEnv = await confirm({
    message: "Do you want to overwrite the existing .env.local file?",
  });
  handleCancellation(writeEnv);
}

if (writeEnv) {
  spin.start("Writing environment variables to .env.local");
  await writeEnvFile(
    String(databaseUrl),
    setup.authSecret,
    setup.keycloakClientSecret,
  );
  spin.stop("Environment variables written!");
} else {
  console.log(
    "\nIn that case, please set the following values manually in the .env.local file:",
  );
  console.log(`DATABASE_URL=${String(databaseUrl)}`);
  console.log(`AUTH_SECRET=${setup.authSecret}`);
  console.log(`KEYCLOAK_CLIENT_SECRET=${setup.keycloakClientSecret}`);
}

outro(`You're all set! Run 'pnpm dev' to start the server.`);
