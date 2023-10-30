import { dev } from "$app/environment";
import { Client } from "minio";
import {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ROOT_USER,
  MINIO_ROOT_PASSWORD,
} from "$env/static/private";

const minio = new Client({
  endPoint: MINIO_ENDPOINT || "localhost",
  port: Number.parseInt(MINIO_PORT || "443", 10),
  useSSL: MINIO_USE_SSL === "true",
  accessKey: MINIO_ROOT_USER || "",
  secretKey: MINIO_ROOT_PASSWORD || "",
});

export { CopyConditions } from "minio";
export default minio;

export const MINIO_BASE_URL = !dev
  ? `https://${MINIO_ENDPOINT}/`
  : `http://${MINIO_ENDPOINT}:${MINIO_PORT}/`;
