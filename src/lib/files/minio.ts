import { Client } from "minio";
import { MINIO_ROOT_USER, MINIO_ROOT_PASSWORD } from "$env/static/private";
import { PUBLIC_MINIO_ENDPOINT, PUBLIC_MINIO_PORT, PUBLIC_MINIO_USE_SSL } from "$env/static/public";

export const MINIO_BASE_URL = (() => {
  if (PUBLIC_MINIO_PORT === "443") return `https://${PUBLIC_MINIO_ENDPOINT}/`;
  if (PUBLIC_MINIO_PORT === "80") return `http://${PUBLIC_MINIO_ENDPOINT}/`;
  return `http${PUBLIC_MINIO_USE_SSL ? "s" : ""}://${PUBLIC_MINIO_ENDPOINT}:${PUBLIC_MINIO_PORT}/`;
})();

const minio = new Client({
  endPoint: PUBLIC_MINIO_ENDPOINT || "localhost",
  port: Number.parseInt(PUBLIC_MINIO_PORT || "443", 10),
  useSSL: PUBLIC_MINIO_USE_SSL === "true",
  accessKey: MINIO_ROOT_USER || "",
  secretKey: MINIO_ROOT_PASSWORD || "",
});

export { CopyConditions } from "minio";
export default minio;
