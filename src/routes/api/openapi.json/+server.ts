import type { RequestHandler } from "./$types";
import openapi from "./openapi.json";

const openapiString = JSON.stringify(openapi);

export const GET: RequestHandler = () => {
	return new Response(openapiString, {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
