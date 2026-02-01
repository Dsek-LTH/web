import { redirect } from "$lib/utils/redirect";
import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";
import { env } from "$env/dynamic/private";
import { type SuperValidated, fail } from "sveltekit-superforms";
import type { ActionFailure, RequestEvent } from "@sveltejs/kit";

export type ScheduleSuccess = {
  redirectFunction: () => never;
  scheduledId: string;
};

export type ScheduleResult =
  | ActionFailure<{
      form: SuperValidated<Record<string, unknown>>;
      message: string;
    }>
  | ScheduleSuccess;

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
): Promise<ScheduleResult> => {
  const jwt = await getDecryptedJWT(request);
  let result;
  try {
    result = await fetch(
      `${env.SCHEDULER_ENDPOINT}?password=${env.SCHEDULER_PASSWORD}`,
      {
        method: "POST",
        body: JSON.stringify({
          body: JSON.stringify(data),
          endpointURL,
          runTimestamp: publishTime,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt?.id_token}`,
        },
      },
    );
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

  const body: { scheduledTaskID: number } = await result.json();

  return {
    redirectFunction: () =>
      redirect(
        redirectEndpoint,
        {
          message: successMessage,
          type: "success",
        },
        event,
      ),
    scheduledId: body.scheduledTaskID.toString(),
  };
};
