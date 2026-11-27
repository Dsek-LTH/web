import { Prisma } from "@prisma/client";
import { env } from "$env/dynamic/private";

const PRISMA_LOG_LEVELS = ["silent", "writes", "all"] as const;
type PRISMA_LOG_LEVEL = (typeof PRISMA_LOG_LEVELS)[number];

const PAYLOAD_KEYS = ["data", "create", "update"] as const;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function describeSelectedRecord(where: Record<string, unknown>): string {
  const id = where["id"];

  // A record id is a UUID, not personal data, so it is safe to log for tracing.
  if (typeof id === "string") {
    return `where={id:${id}}`;
  }

  return `where=[${Object.keys(where).join(", ")}]`;
}

function describeWrittenFieldNames(
  payloadKey: string,
  payload: Record<string, unknown>,
): string {
  return `${payloadKey}=[${Object.keys(payload).join(", ")}]`;
}

function describeWrittenRowCount(payloadKey: string, rows: unknown[]): string {
  return `${payloadKey}=[${rows.length} rows]`;
}

function describeWrittenPayload(
  payloadKey: string,
  payload: unknown,
): string | null {
  if (Array.isArray(payload)) {
    return describeWrittenRowCount(payloadKey, payload);
  }
  if (isRecord(payload)) {
    return describeWrittenFieldNames(payloadKey, payload);
  }
  return null;
}

// Describe which record and which fields an operation touched, but never the field values.
// The values routinely contain personal data such as emails, food preferences, and free-text answers, which must not end up in the logs.
function summarizeArguments(args: unknown): string {
  if (!isRecord(args)) {
    return "";
  }

  const descriptions: string[] = [];

  const where = args["where"];
  if (isRecord(where)) {
    descriptions.push(describeSelectedRecord(where));
  }

  for (const payloadKey of PAYLOAD_KEYS) {
    const description = describeWrittenPayload(payloadKey, args[payloadKey]);
    if (description !== null) {
      descriptions.push(description);
    }
  }

  return descriptions.join(" ");
}

function describeCaller(studentId?: string): string {
  return studentId ?? "anonymous";
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

        const summary = summarizeArguments(args);
        console.log(
          `${describeCaller(studentId)} called ${model}.${operation}${
            summary ? ` ${summary}` : ""
          }`,
        );

        return query(args);
      },
    },
  });
