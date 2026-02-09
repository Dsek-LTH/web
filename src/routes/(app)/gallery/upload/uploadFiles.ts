import { uploadFile } from "$lib/files/uploadFiles";
import type { AuthUser } from "@zenstackhq/runtime";
import type { UploadSchema } from "./types";
import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";

export const uploadAlbumFiles = async (user: AuthUser, data: UploadSchema) => {
  const prefix = "public/" + data.date.split("-")[0] + "/" + data.date + " " +
    data.name;
  const bucket = PUBLIC_BUCKETS_ALBUMS;

  const tasks: Array<Promise<string>> = [];
  Array.from(data.files).forEach((file) => {
    tasks.push(uploadFile(user, file, prefix, bucket, file.name));
  });
  await Promise.resolve();
};
