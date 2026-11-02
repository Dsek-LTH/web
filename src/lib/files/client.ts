import { publicEnv } from "$lib/env/public";
export const MINIO_BASE_URL = publicEnv.PUBLIC_MINIO_BASE_URL + "/";

export const getFileUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("minio/")) {
    return `${MINIO_BASE_URL}${imageUrl.substring(6)}`;
  }
  return imageUrl;
};
