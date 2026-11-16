import { uploadFile } from "$lib/files/uploadFiles";
import type { AuthUser } from "@zenstackhq/runtime";
import type { UploadSchema } from "./types";
import { publicEnv } from "$lib/env/public";

export const uploadAlbumFiles = async (
  user: AuthUser,
  data: UploadSchema,
  albumId: string,
) => {
  const prefix = "public/" + albumId + "/album";
  const bucket = publicEnv.PUBLIC_BUCKETS_ALBUMS;

  const tasks: Array<Promise<string>> = [];
  Array.from(data.albumFiles).forEach((file) => {
    tasks.push(uploadFile(user, file, prefix, bucket, file.name));
  });
  await Promise.all(tasks);
};

export const uploadCoverFile = async (
  user: AuthUser,
  data: UploadSchema,
  albumId: string,
) => {
  const prefix = "public/" + albumId + "/cover";
  const bucket = publicEnv.PUBLIC_BUCKETS_ALBUMS;
  const file = data.coverFile ? data.coverFile : data.albumFiles[0];
  if (!file) {
    throw new Error("Empty album cannot be uploaded");
  }
  return await uploadFile(user, file, prefix, bucket, file.name);
};
