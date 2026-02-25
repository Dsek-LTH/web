import { exec } from "child_process";
import util from "util";

/**
 * Checks for an active SSH tunnel to a PostgreSQL database.
 * @throws {Error} If such a tunnel is detected.
 */
export const checkForPostgresTunnel = async () => {
	try {
		/**
		 * lsof means "list open files", the -i flag lists ip-sockets
		 * grep is used to filter the results to only show SSH tunnels to a PostgreSQL database
		 */
		const ipSockets = await util.promisify(exec)(
			"lsof -i | grep -E 'ssh.*:postgresq?l? \\(LISTEN\\)'",
		);

		/**
     * When an SSH tunnel through the PostgreSQL port (5432) is open,
     * the following should be returned, hence the length === 3 (there's one empty line) check.
          ssh     71212 username    4u  IPv6 986506      0t0  TCP ip6-localhost:postgresql (LISTEN)
          ssh     71212 username    5u  IPv4 986507      0t0  TCP localhost:postgresql (LISTEN)

     */
		if (ipSockets.stdout.split("\n").length === 3) {
			throw new Error(
				"Cancelled seeding: A PostgreSQL SSH tunnel was detected! You may be accidentally connected to the production database.",
			);
		}
	} catch {
		// Ignore the error because exec fails with exit code 1 if no matching process is found.
		// This is expected when there is no Postgres SSH tunnel running.
	}
};
