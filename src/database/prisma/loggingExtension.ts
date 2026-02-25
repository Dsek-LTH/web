import { Prisma } from "@prisma/client";
import { env } from "$env/dynamic/private";

const PRISMA_LOG_LEVELS = ["silent", "writes", "all"] as const;
type PRISMA_LOG_LEVEL = (typeof PRISMA_LOG_LEVELS)[number];

function isValidLogLevel(level: string): level is PRISMA_LOG_LEVEL {
	return PRISMA_LOG_LEVELS.some((l) => l === level);
}

function getPrismaLogLevel(): PRISMA_LOG_LEVEL {
	if (isValidLogLevel(env.PRISMA_LOG_LEVEL)) {
		return env.PRISMA_LOG_LEVEL;
	}

	if (process.env["NODE_ENV"] === "production") {
		return "writes";
	}

	return "silent";
}

function isWrite(operation: string) {
	const MODIFY_OPERATIONS = [`create`, `up`, `delete`];
	return MODIFY_OPERATIONS.some((op) => operation.startsWith(op));
}

const logLevel = getPrismaLogLevel();

export default (studentId?: string) =>
	Prisma.defineExtension({
		name: "logging",
		query: {
			$allModels: {},
			$allOperations({ model, operation, args, query }) {
				if (logLevel === "silent") {
					return query(args);
				}

				if (logLevel === "writes" && !isWrite(operation)) {
					return query(args);
				}

				console.log(
					`${studentId ?? "anonymous"} called ${model}.${operation} with args:`,
					JSON.stringify(args),
				);

				return query(args);
			},
		},
	});
