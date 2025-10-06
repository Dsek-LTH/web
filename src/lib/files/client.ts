import {
  PUBLIC_MINIO_ENDPOINT,
  PUBLIC_MINIO_PORT,
  PUBLIC_MINIO_USE_SSL,
} from "$env/static/public";
export const MINIO_BASE_URL = (() => {
  if (PUBLIC_MINIO_PORT === "443") return `https://${PUBLIC_MINIO_ENDPOINT}/`;
  if (PUBLIC_MINIO_PORT === "80") return `http://${PUBLIC_MINIO_ENDPOINT}/`;
  return `http${
    PUBLIC_MINIO_USE_SSL === "true" ? "s" : ""
  }://${PUBLIC_MINIO_ENDPOINT}:${PUBLIC_MINIO_PORT}/`;
})();

export const getFileUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("minio/")) {
    return `${MINIO_BASE_URL}${imageUrl.substring(6)}`;
  }
  return imageUrl;
};
