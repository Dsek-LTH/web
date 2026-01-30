import { redirect } from "$lib/utils/redirect";
import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";
import { env } from "$env/dynamic/private";
import { type SuperValidated, fail } from "sveltekit-superforms";
import type { RequestEvent } from "@sveltejs/kit";

export const scheduleExecution = async (
  request: Request,
  endpointURL: string,
  data: Record<string, unknown>,
  publishTime: Date,
  form: SuperValidated<Record<string, unknown>>,
  errorMessage: string,
  successMessage: string,
  redirectEndpoint: string,
  event: RequestEvent,
) => {
  const jwt = await getDecryptedJWT(request);
  let result;
  try {
    result = await fetch(env.SCHEDULER_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        body: JSON.stringify(data),
        endpointURL,
        runTimestamp: publishTime,
        password: env.SCHEDULER_PASSWORD,
        token: jwt?.["id_token"],
      }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return fail(500, {
      form,
      message: `${errorMessage}: ${error}`,
    });
  }

  if (!result.ok) {
    return fail(500, {
      form,
      message: errorMessage,
    });
  }

  throw redirect(
    redirectEndpoint,
    {
      message: successMessage,
      type: "success",
    },
    event,
  );
};
