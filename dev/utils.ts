import { cancel, isCancel, spinner } from "@clack/prompts";
import { type ExecException, exec } from "child_process";
import { randomBytes } from "crypto";
import { access, writeFile } from "fs/promises";
import { resolve } from "path";

const POSTGRES_DOCKER_URL =
	"postgresql://postgres:postgres@localhost:5432/dsek_prod?schema=public";
const POSTGRES_DOCKER_COMMAND =
	"docker run --name dsek-database -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dsek_prod -d postgres:14-alpine";
const POSTGRES_URL_REGEX =
	/^(postgres|postgresql):\/\/([^\s:]+):([^\s@]+)@([^\s:]+):(\d+)\/([^\s?]+)(\?schema=([^\s]+))?$/;
const ENV_FILE_PATH = resolve(__dirname, "..", ".env.local");

const spin = spinner();

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function envFileExists() {
	return fileExists(ENV_FILE_PATH);
}

/**
 * Write the environment variables to a .env file.
 * @param url The PostgreSQL URL
 * @param authSecret The auth secret
 * @param keycloakClientSecret The Keycloak client secret
 * @returns A promise that resolves when the file is written
 */
async function writeEnvFile(
	url: string,
	authSecret: string,
	keycloakClientSecret: string,
) {
	await writeFile(
		ENV_FILE_PATH,
		`DATABASE_URL=${String(
			url,
		)}\nAUTH_SECRET=${authSecret}\nKEYCLOAK_CLIENT_SECRET=${keycloakClientSecret}`,
	);
}

/**
 * Handle cancellation from CLI prompts, i.e CTRL+C.
 * @param value The value returned from the prompt
 */
function handleCancellation<T>(value: T) {
	if (isCancel(value)) {
		onCancel();
	}
}

/**
 * Print a message and exit the process.
 */
function onCancel() {
	cancel("Setup aborted.");
	process.exit(0);
}

/**
 * Run a shell command using `exec` and return a promise that resolves when the command is done.
 * @param command The command to run
 * @returns A promise that resolves when the command is done
 */
function run(command: string): Promise<void> {
	return new Promise((resolve) => {
		exec(command, {}, (error) => {
			if (error) onError(error);
			resolve();
		});
	});
}

/**
 * Run a shell command using `exec` and show a spinner while it's running.
 * @param command The command to run
 * @param startMessage The message to show while the command is running
 * @param stopMessage The message to show when the command is done
 * @returns
 */
function runWithSpinner(
	command: string,
	startMessage?: string,
	stopMessage?: string,
): Promise<void> {
	spin.start(startMessage);
	return run(command).finally(() => spin.stop(stopMessage));
}

/**
 * Setup the PostgreSQL database using Docker.
 * @returns A promise that resolves when the database is ready.
 */
function setupDatabase() {
	return runWithSpinner(
		POSTGRES_DOCKER_COMMAND,
		"Setting up PostgreSQL",
		"PostgreSQL setup complete!",
	);
}

/**
 * Validate a PostgreSQL URL.
 * @param value
 * @returns An error message if the URL is invalid
 */
function validateDbUrl(value: string) {
	if (POSTGRES_URL_REGEX.test(value)) return;
	return "Please provide a valid PostgreSQL URL";
}

/**
 * Generate a random secret.
 * @param N The length of the secret
 * @returns A random secret in hex format
 */
function generateSecret(N = 32) {
	return randomBytes(N / 2).toString("hex");
}

/**
 * Handle errors from `exec` and exit the process.
 * @param error The error from `exec`
 */
function onError(error: ExecException | null) {
	// If the error is that the container already exists, we can ignore it
	if (error && !error.message.includes("is already in use")) {
		console.error(); // New line
		console.error(error);
		process.exit(1);
	}
}

export {
	POSTGRES_DOCKER_URL,
	envFileExists,
	generateSecret,
	handleCancellation,
	onCancel,
	runWithSpinner,
	setupDatabase,
	spin,
	validateDbUrl,
	writeEnvFile,
};
