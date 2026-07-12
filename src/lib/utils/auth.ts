import { env } from "$env/dynamic/public";
import {
  signIn as authSignIn,
  signOut as authSignOut,
} from "@auth/sveltekit/client";
import type { JWT } from "@auth/core/jwt";

export function signIn() {
  return authSignIn("authentik");
}

export function signOut() {
  return authSignOut({
    redirectTo: `${env.PUBLIC_AUTH_AUTHENTIK_ISSUER}end-session/`,
  });
}

export function isTokenValid(token: JWT) {
  return token.expires_at && Date.now() < (token.expires_at as number) * 1000;
}

type TokenRefreshOptions = {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
};

type TokenRefreshResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
};

// Deduplicates concurrent refresh requests for the same refresh_token,
// so multiple simultaneous calls don't trigger multiple network requests.
const pendingRefreshesByToken = new Map<
  string,
  Promise<TokenRefreshResponse>
>();

export function fetchNewToken(
  token: JWT,
  { clientId, clientSecret, tokenEndpoint }: TokenRefreshOptions,
) {
  const refreshToken = token.refresh_token;
  if (!refreshToken) throw new Error("Missing refresh_token");

  let pendingRefresh = pendingRefreshesByToken.get(refreshToken);
  if (!pendingRefresh) {
    pendingRefresh = fetch(tokenEndpoint, {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw body;
        return body;
      })
      .finally(() => {
        setTimeout(() => {
          pendingRefreshesByToken.delete(refreshToken);
        }, 10000);
      });
    pendingRefreshesByToken.set(refreshToken, pendingRefresh);
  }

  return pendingRefresh;
}

export function decodeAccessToken(accessToken: string): JWT {
  const [, payload] = accessToken.split(".");
  if (!payload) throw new Error("Invalid JWT format");

  return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
}
