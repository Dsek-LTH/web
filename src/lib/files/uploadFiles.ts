import { fileHandler } from "$lib/files";
import type { AuthUser } from "@zenstackhq/runtime";
import * as m from "$paraglide/messages";
import sharp, { type ResizeOptions, type WebpOptions } from "sharp";
import {
  getNameOfFile,
  isFileImage,
  prepareNameForFilesystem,
} from "$lib/files/utils";
import { MINIO_BASE_URL } from "$lib/files/client";

export const compressImage = async (
  image: File,
  options?: {
    resize?: ResizeOptions;
    webp?: WebpOptions;
  },
) =>
  await sharp(await image.arrayBuffer())
    // this is required to keep the image upright
    .rotate()
    .resize({
      fit: "cover",
      withoutEnlargement: true,
      ...options?.resize,
    })
    // save as webp
    .webp(options?.webp)
    .toBuffer();

export const uploadFile = async (
  user: AuthUser,
  file: File,
  prefix: string,
  bucket: string,
  name?: string,
  compressionOptions?: Parameters<typeof compressImage>[1] | false, // false means no compression, undefined is default compression (for images only of course)
) => {
  let formattedName = prepareNameForFilesystem(
    name ?? getNameOfFile(file.name),
    file.name,
  );
  // await prisma.meeting.upsert({
  //   where: { url: folderPath },
  //   update: {},
  //   create: { title: meeting, date, url: folderPath },
  // });

  let dataToUpload: File | Buffer = file;
  if (isFileImage(file) && compressionOptions !== false) {
    try {
      dataToUpload = await compressImage(file, compressionOptions);
      formattedName = prepareNameForFilesystem(
        name ?? getNameOfFile(file.name),
        file.name,
        "webp",
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not compress image: ${errMsg}`);
    }
  }

  const filePath = `${prefix}/${formattedName}`;

  try {
    const putUrl = await fileHandler.getPresignedPutUrl(
      user,
      bucket,
      filePath,
      true,
    );
    const res = await fetch(putUrl, {
      method: "PUT",
      body: dataToUpload,
    });
    if (!res.ok) {
      throw new Error(
        `${m.members_errors_couldntUploadFile()}: ${await res.text()}`,
      );
    }
    return `${MINIO_BASE_URL}${bucket}/${filePath}`;
  } catch (e) {
    console.error(e);
    const errMsg = e instanceof Error ? e.message : String(e);
    throw new Error(`${m.members_errors_couldntUploadFile()}: ${errMsg}`);
  }
};
