import { env } from "$env/dynamic/private";
import { Client } from "minio";

const minio = new Client({
  endPoint: env.MINIO_ENDPOINT || "localhost",
  port: env.MINIO_PORT
    ? Number.parseInt(env.MINIO_PORT, 10)
    : env.MINIO_USE_SSL === "true"
      ? 443
      : 80,
  useSSL: env.MINIO_USE_SSL === "true",
  accessKey: env.MINIO_ROOT_USER || "",
  secretKey: env.MINIO_ROOT_PASSWORD || "",
});

export { CopyConditions } from "minio";
export default minio;
