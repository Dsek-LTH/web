import Keycloak from "@auth/core/providers/keycloak";
import { SvelteKitAuth } from "@auth/sveltekit";
import {
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_CLIENT_ISSUER,
  AUTH_SECRET,
} from "$env/static/private";
import { sourceLanguageTag } from "$paraglide/runtime";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const lang = event.params["lang"] ?? sourceLanguageTag;

  /*
   * Normally SvelteKitAuth is the only response handler, but we want to
   * modify the HTML before it is sent to the client. We can do that
   * by passing it a custom `resolve` function.
   */
  const resolveWithOptions: typeof resolve = (event) =>
    resolve(event, {
      // Set the `lang` variable in the app.html file
      transformPageChunk({ done, html }) {
        // Only do it at the very end of the rendering process
        if (done) {
          return html.replace("%lang%", lang);
        }
      },
    });

  const authHandle = SvelteKitAuth({
    secret: AUTH_SECRET,
    providers: [
      Keycloak({
        clientId: KEYCLOAK_CLIENT_ID,
        clientSecret: KEYCLOAK_CLIENT_SECRET,
        issuer: KEYCLOAK_CLIENT_ISSUER,
        profile: (profile, tokens) => {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.image,
            student_id: profile.preferred_username,
            group_list: profile.group_list,
            access_token: tokens.access_token,
            id_token: tokens.id_token,
          };
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.student_id = user?.student_id;
          token.group_list = user?.group_list ?? [];
          token.access_token = user?.access_token;
          token.id_token = user?.id_token;
        }
        return token;
      },
      session(params) {
        const { session } = params;
        if ("token" in params && params.session?.user) {
          const { token } = params;
          session.user.student_id = token.student_id;
          session.user.group_list = token.group_list;
        }
        return session;
      },
    },
    events: {
      async signOut(message) {
        if (!("token" in message)) {
          return;
        }
        const idToken = message.token?.id_token;
        const params = new URLSearchParams();
        params.append("id_token_hint", idToken as string);
        await fetch(
          `${KEYCLOAK_CLIENT_ISSUER}/protocol/openid-connect/logout?${params.toString()}`,
        );
      },
    },
  });
  const response = await authHandle({ event, resolve: resolveWithOptions });

  return response;
};
