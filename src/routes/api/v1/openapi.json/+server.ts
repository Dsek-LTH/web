import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { buildOpenApiSpec } from "$lib/server/api/openapi";

export const GET: RequestHandler = () => json(buildOpenApiSpec());
