import { PUBLIC_MINIO_BASE_URL } from "$env/static/public";
export const MINIO_BASE_URL = PUBLIC_MINIO_BASE_URL + "/";

export const getFileUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("minio/")) {
    return `${MINIO_BASE_URL}${imageUrl.substring(6)}`;
  }
  return imageUrl;
};
