import type { JWT } from "@auth/core/jwt";
import Keycloak from "@auth/core/providers/keycloak";
import type { Session } from "@auth/core/types";
import { SvelteKitAuth } from "@auth/sveltekit";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_CLIENT_ISSUER } from "$env/static/private";


export const handle = SvelteKitAuth({
    providers: [Keycloak({
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
      
      
    })],
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
      session({ session, token }: {
        session: Session,
        token: JWT,
      }) {
        if (session?.user) {
            session.user.student_id = token.student_id;
            session.user.group_list = token.group_list;
        }
        return session;
      },
    },
    events: {
      async signOut(message) {
          if (!('token' in message)) {
            return;
          }
          const idToken = message.token?.id_token;
          const params = new URLSearchParams();
          params.append('id_token_hint', idToken as string);
          fetch(`${KEYCLOAK_CLIENT_ISSUER}/protocol/openid-connect/logout?${params.toString()}`);
      },
    },
    debug: true,
  })