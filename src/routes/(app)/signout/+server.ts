import { signOut } from "@auth/sveltekit/client";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	await signOut();

	return new Response(null, {
		status: 302,
		headers: {
			location: "/",
		},
	});
};
