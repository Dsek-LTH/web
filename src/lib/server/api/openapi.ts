import { z } from "zod";
import { getEndpointDefinition } from "./endpoint";

const SPEC_ROUTE_FILE = "/src/routes/api/v1/openapi.json/+server.ts";
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

// Path comes from the route file location, never from the endpoint
// definition — that's the one thing SvelteKit already knows, so duplicating
// it here would just be a second place for it to drift out of sync.
function filePathToOpenApiPath(file: string): string {
  return file
    .replace("/src/routes/api/v1", "/api/v1")
    .replace(/\/\+server\.ts$/, "")
    .replace(/\[(\w+)\]/g, "{$1}");
}

function pathParamNames(routePath: string): Set<string> {
  return new Set([...routePath.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));
}

function schemaRef(schema: z.ZodType): Record<string, unknown> {
  const id = z.globalRegistry.get(schema)?.id;
  return id
    ? { $ref: `#/components/schemas/${id}` }
    : z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any" });
}

function isOptional(schema: z.ZodType): boolean {
  return schema.safeParse(undefined).success;
}

// Every field of `input` that isn't a path param is a query param (GET) or
// a JSON body field (mutations) — this mirrors exactly how endpoint() folds
// params/query/body into that one object, so it has to stay in sync with it.
function buildParameters(routePath: string, input: z.ZodType) {
  if (!(input instanceof z.ZodObject)) return undefined;
  const pathNames = pathParamNames(routePath);
  const parameters = Object.entries(input.shape as Record<string, z.ZodType>)
    .filter(([name]) => pathNames.has(name))
    .map(([name, fieldSchema]) => ({
      name,
      in: "path",
      required: true,
      schema: schemaRef(fieldSchema),
    }));
  return parameters.length ? parameters : undefined;
}

function buildQueryParameters(routePath: string, input: z.ZodType) {
  if (!(input instanceof z.ZodObject)) return undefined;
  const pathNames = pathParamNames(routePath);
  const parameters = Object.entries(input.shape as Record<string, z.ZodType>)
    .filter(([name]) => !pathNames.has(name))
    .map(([name, fieldSchema]) => ({
      name,
      in: "query",
      required: !isOptional(fieldSchema),
      schema: schemaRef(fieldSchema),
    }));
  return parameters.length ? parameters : undefined;
}

function buildRequestBody(routePath: string, input: z.ZodType) {
  if (!(input instanceof z.ZodObject)) return undefined;
  const pathNames = pathParamNames(routePath);
  const bodyShape = Object.fromEntries(
    Object.entries(input.shape as Record<string, z.ZodType>).filter(
      ([name]) => !pathNames.has(name),
    ),
  );
  if (Object.keys(bodyShape).length === 0) return undefined;
  return {
    content: { "application/json": { schema: schemaRef(z.object(bodyShape)) } },
  };
}

export function buildOpenApiSpec() {
  const modules = import.meta.glob("/src/routes/api/v1/**/+server.ts", {
    eager: true,
  }) as Record<string, Record<string, unknown>>;

  const paths: Record<string, Record<string, unknown>> = {};

  for (const [file, mod] of Object.entries(modules)) {
    if (file === SPEC_ROUTE_FILE) continue;
    const routePath = filePathToOpenApiPath(file);

    for (const [exportName, handler] of Object.entries(mod)) {
      if (!HTTP_METHODS.has(exportName)) continue;
      const def = getEndpointDefinition(handler);
      if (!def) continue;
      const method = exportName.toLowerCase();

      const status = String(def.status ?? 200);

      paths[routePath] ??= {};
      paths[routePath][method] = {
        operationId: def.operationId,
        summary: def.summary,
        parameters: [
          ...(buildParameters(routePath, def.input) ?? []),
          ...(method === "get" ? (buildQueryParameters(routePath, def.input) ?? []) : []),
        ],
        ...(method !== "get" && { requestBody: buildRequestBody(routePath, def.input) }),
        responses: {
          [status]: {
            description: status === "201" ? "Created" : "OK",
            content: { "application/json": { schema: schemaRef(def.output) } },
          },
          "400": { description: "Invalid input" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      };
    }
  }

  const { schemas } = z.toJSONSchema(z.globalRegistry, {
    target: "draft-2020-12",
    unrepresentable: "any",
    uri: (id) => `#/components/schemas/${id}`,
  });

  return {
    openapi: "3.1.0",
    info: { title: "D-sek Songbook API (prototype)", version: "0.1.0" },
    paths,
    components: { schemas },
  };
}
