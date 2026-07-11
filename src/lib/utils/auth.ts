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

export interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

const refreshPromises = new Map<string, Promise<TokenRefreshResponse>>();

export function refreshToken(token: JWT, {
  clientId,
  clientSecret,
  tokenEndpoint,
}: {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}) {
  if (!token.refresh_token) throw new Error("Missing refresh_token");

  let promise = refreshPromises.get(token.refresh_token as string);
  if (!promise) {
    promise = fetch(tokenEndpoint, {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token as string,
      }),
    })
      .then(async (response) => {
        const tokensOrError = await response.json();
        if (!response.ok) throw tokensOrError;
        return tokensOrError;
      })
      .finally(() => {
        setTimeout(() => {
          refreshPromises.delete(token.refresh_token as string);
        }, 10000);
      });
    refreshPromises.set(token.refresh_token as string, promise);
  }

  return promise;
}

export function decodeToken(accessToken: string) {
  const [, payload] = accessToken.split(".");
  if (!payload) throw new Error("Invalid JWT format");

  return JSON.parse(
    Buffer.from(payload, "base64").toString("utf-8"),
  );
}
