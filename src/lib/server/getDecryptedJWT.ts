import { env } from "$env/dynamic/private";
import { getToken, type JWT } from "@auth/core/jwt";

export const getDecryptedJWT = async (req: Request): Promise<JWT | null> => {
  return await getToken({ req, secret: env.AUTH_SECRET });
};
