import { MINIO_ROOT_PASSWORD, MINIO_ROOT_USER } from "$env/static/private";
import {
  PUBLIC_MINIO_ENDPOINT,
  PUBLIC_MINIO_PORT,
  PUBLIC_MINIO_USE_SSL,
} from "$env/static/public";
import { Client } from "minio";

const minio = new Client({
  endPoint: PUBLIC_MINIO_ENDPOINT || "localhost",
  port: PUBLIC_MINIO_PORT
    ? Number.parseInt(PUBLIC_MINIO_PORT, 10)
    : PUBLIC_MINIO_USE_SSL === "true"
      ? 443
      : 80,
  useSSL: PUBLIC_MINIO_USE_SSL === "true",
  accessKey: MINIO_ROOT_USER || "",
  secretKey: MINIO_ROOT_PASSWORD || "",
});

export { CopyConditions } from "minio";
export default minio;
