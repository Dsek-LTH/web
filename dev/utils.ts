import { cancel, isCancel, spinner } from "@clack/prompts";
import { ExecException, exec } from "child_process";
import { access } from "fs/promises";
import { resolve } from "path";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function onError(error: ExecException | null) {
  // If the error is that the container already exists, we can ignore it
  if (error && !error.message.includes("is already in use")) {
    console.error(); // New line
    console.error(error);
    process.exit(1);
  }
}

function handleCancellation<T>(value: T) {
  if (isCancel(value)) {
    onCancel();
  }
}

function onCancel() {
  cancel("Setup aborted.");
  process.exit(0);
}

function run(command: string): Promise<void> {
  return new Promise((resolve) => {
    exec(command, {}, (error) => {
      if (error) onError(error);
      resolve();
    });
  });
}

function runWithSpinner(
  command: string,
  startMessage?: string,
  stopMessage?: string
): Promise<void> {
  spin.start(startMessage);
  return run(command).finally(() => spin.stop(stopMessage));
}

const POSTGRES_DOCKER_URL = "postgresql://postgres:postgres@localhost:5432/new_web?schema=public";
const POSTGRES_DOCKER_COMMAND =
  "docker run --name dsek-database -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=new_web -d postgres:14-alpine";
const POSTGRES_URL_REGEX =
  /^(postgres|postgresql):\/\/([^\s:]+):([^\s@]+)@([^\s:]+):(\d+)\/([^\s?]+)(\?schema=([^\s]+))?$/;
const ENV_FILE_PATH = resolve(__dirname, "..", ".env.local");

const spin = spinner();

export {
  ENV_FILE_PATH,
  POSTGRES_DOCKER_COMMAND,
  POSTGRES_DOCKER_URL,
  POSTGRES_URL_REGEX,
  spin,
  fileExists,
  handleCancellation,
  onCancel,
  onError,
  run,
  runWithSpinner,
};
