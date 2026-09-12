import { dev } from "$app/environment";
import { error, json, type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import type { z } from "zod";
import { ServiceError } from "./errors";

export type EndpointDefinition<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
> = {
  operationId: string;
  summary: string;
  /** Success status code. Defaults to 200; e.g. 201 for a create endpoint. */
  status?: number;
  input: TInput;
  output: TOutput;
  handle: (
    input: z.infer<TInput>,
    event: RequestEvent,
  ) => Promise<z.infer<TOutput>> | z.infer<TOutput>;
};

const DEFINITION = Symbol("endpointDefinition");

type HandlerWithDefinition = RequestHandler & {
  [DEFINITION]?: EndpointDefinition<z.ZodType, z.ZodType>;
};

export function getEndpointDefinition(handler: unknown) {
  return (handler as HandlerWithDefinition | undefined)?.[DEFINITION];
}

export function endpoint<TInput extends z.ZodType, TOutput extends z.ZodType>(
  def: EndpointDefinition<TInput, TOutput>,
): RequestHandler {
  const handler: RequestHandler = async (event) => {
    const raw: Record<string, unknown> = {};
    for (const key of event.url.searchParams.keys()) {
      const values = event.url.searchParams.getAll(key);
      raw[key] = values.length > 1 ? values : values[0];
    }
    if (event.request.method !== "GET" && event.request.method !== "HEAD") {
      const contentType = event.request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        Object.assign(raw, await event.request.json().catch(() => ({})));
      }
    }
    // Path params are applied last so a body/query field can never spoof
    // the resource a path segment already pins down (e.g. `slug` in the body
    // of `PUT /songs/{slug}` retargeting the update to another song).
    Object.assign(raw, event.params);

    const parsedInput = def.input.safeParse(raw);
    if (!parsedInput.success) {
      return json(
        { message: "Invalid input", issues: parsedInput.error.issues },
        { status: 400 },
      );
    }

    let result: unknown;
    try {
      result = await def.handle(parsedInput.data, event);
    } catch (err) {
      if (err instanceof ServiceError) {
        return json({ message: err.message }, { status: err.status });
      }
      throw err;
    }

    if (dev) {
      const parsedOutput = def.output.safeParse(result);
      if (!parsedOutput.success) {
        error(
          500,
          `Endpoint ${def.operationId} returned data that doesn't match its output schema: ${parsedOutput.error.message}`,
        );
      }
    }

    return json(result, { status: def.status ?? 200 });
  };

  Object.defineProperty(handler, DEFINITION, { value: def, enumerable: false });

  return handler;
}
