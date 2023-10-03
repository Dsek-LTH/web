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
      profile: (profile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.image,
          student_id: profile.preferred_username,
          group_list: profile.group_list,
        };
      },
      
      
    })],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
            token.student_id = user?.student_id;
            token.group_list = user?.group_list ?? [];
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
    debug: true,
  })