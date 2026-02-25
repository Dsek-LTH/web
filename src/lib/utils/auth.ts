import { env } from "$env/dynamic/public";
import {
	signIn as authSignIn,
	signOut as authSignOut,
} from "@auth/sveltekit/client";

export function signIn() {
	return authSignIn("authentik");
}

export function signOut() {
	return authSignOut({
		redirectTo: `${env.PUBLIC_AUTH_AUTHENTIK_ISSUER}end-session/`,
	});
}
