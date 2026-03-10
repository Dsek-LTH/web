import { env } from "$env/dynamic/private";
import { getToken, type JWT } from "@auth/core/jwt";

/**
 * Decrypts and returns the JWT from the request cookie.
 *
 * Use this function when you need to access the authenticated user's JWT from a request.
 * Returns the JWT object if the user is authenticated, or `null` if the user is not authenticated
 * or if the JWT is missing or invalid.
 *
 * @param req - The incoming HTTP request containing the JWT cookie.
 * @returns The decrypted JWT object, or `null` if not authenticated.
 */
export const getDecryptedJWT = async (req: Request): Promise<JWT | null> => {
  return await getToken({
    req,
    secret: env.AUTH_SECRET,
    secureCookie: env["NODE_ENV"] === "production",
  });
};
