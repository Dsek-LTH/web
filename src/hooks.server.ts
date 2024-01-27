import {
  AUTH_SECRET,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_ISSUER,
  KEYCLOAK_CLIENT_SECRET,
} from "$env/static/private";
import { sourceLanguageTag } from "$paraglide/runtime";
import Keycloak, { type KeycloakProfile } from "@auth/core/providers/keycloak";
import type { TokenSet } from "@auth/core/types";
import { SvelteKitAuth } from "@auth/sveltekit";
import { PrismaClient } from "@prisma/client";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { enhance } from "@zenstackhq/runtime";
import { getAccessPolicies } from "./hooks.server.helpers";

const authHandle = SvelteKitAuth({
  secret: AUTH_SECRET,
  providers: [
    Keycloak({
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
      issuer: KEYCLOAK_CLIENT_ISSUER,
      profile: (profile: KeycloakProfile, tokens: TokenSet) => {
        return {
          access_token: tokens.access_token,
          id_token: tokens.id_token,
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          student_id: profile.preferred_username,
          // The keycloak client doesn't guarantee these fields
          // to be present, but we assume they always are.
          image: profile["image"],
          group_list: profile["group_list"] ?? [],
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

const prisma = new PrismaClient();
const databaseHandle: Handle = async ({ event, resolve }) => {
  const session = await event.locals.getSession();
  try {
    if (!session?.user) throw new Error("User session not found");

    const member = await prisma.member.findUnique({
      where: { studentId: session.user.student_id },
    });
    if (!member) throw new Error("Member not found");

    const user = {
      studentId: session.user.student_id,
      memberId: member.id,
      policies: await getAccessPolicies(
        prisma,
        session.user.student_id,
        session.user.group_list,
      ),
    };
    event.locals.prisma = enhance(prisma, { user });
    event.locals.user = user;
    event.locals.member = member;
  } catch (e) {
    event.locals.prisma = enhance(prisma, {
      user: {
        studentId: "anonymous",
        memberId: "anonymous",
        policies: await getAccessPolicies(prisma),
      },
    });
  }

  return resolve(event);
};

const translationHandle: Handle = async ({ event, resolve }) => {
  const lang = event.params["lang"] ?? sourceLanguageTag;

  return resolve(event, {
    transformPageChunk({ done, html }) {
      // Set the `lang` variable in the app.html file
      // Only do it at the very end of the rendering process
      if (done) {
        return html.replace("%lang%", lang);
      }
    },
  });
};

export const handle = sequence(authHandle, databaseHandle, translationHandle);
