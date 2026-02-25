import { redirect } from "$lib/utils/redirect";
import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";
import { env } from "$env/dynamic/private";
import { fail } from "sveltekit-superforms";
import type { ActionFailure, RequestEvent } from "@sveltejs/kit";

export type ScheduleSuccess = {
	redirectFunction: () => never;
	scheduledId: string;
};

export type ScheduleResult<T> =
	| ActionFailure<{
			form: T;
			message: string;
	  }>
	| ScheduleSuccess;

export const isScheduleFailure = <T>(
	result: ScheduleResult<T>,
): result is ActionFailure<{ form: T; message: string }> => {
	return "status" in result;
};

export const scheduleExecution = async <T>(
	request: Request,
	endpointURL: string,
	data: Record<string, unknown>,
	publishTime: Date,
	form: T,
	errorMessage: string,
	successMessage: string,
	redirectEndpoint: string,
	event: RequestEvent,
): Promise<ScheduleResult<T>> => {
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
