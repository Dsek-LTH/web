import { fileHandler } from "$lib/files";
import type { AuthUser } from "@zenstackhq/runtime";
import * as m from "$paraglide/messages";
import sharp, { type ResizeOptions, type WebpOptions } from "sharp";

export const isFileImage = (file: File) => file.type.split("/")[0] === "image";

export const getNameOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return fileName;
  return fileName.slice(0, dotIndex);
};

export const getExtensionOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1);
};
export const prepareNameForFilesystem = (name: string, fileName: string) =>
  // replaces spaces with "_" and removes all special characters
  `${name
    .replace(/\s/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")}.${getExtensionOfFile(fileName)}`;

export const compressImage = async (
  image: File,
  options?: {
    resize?: ResizeOptions;
    webp: WebpOptions;
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
  const formattedName = prepareNameForFilesystem(
    name ?? getNameOfFile(file.name),
    file.name,
  );
  // await prisma.meeting.upsert({
  //   where: { url: folderPath },
  //   update: {},
  //   create: { title: meeting, date, url: folderPath },
  // });

  const filePath = `${prefix}/${formattedName}`;

  let dataToUpload: File | Buffer = file;
  if (isFileImage(file) && compressionOptions !== false) {
    try {
      dataToUpload = await compressImage(file, compressionOptions);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not compress image: ${errMsg}`);
    }
  }

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
    if (!res.ok)
      throw new Error(
        `${m.members_errors_couldntUploadFile()}: ${await res.text()}`,
      );
    return `minio/${bucket}/${filePath}`;
  } catch (e) {
    console.error(e);
    const errMsg = e instanceof Error ? e.message : String(e);
    throw new Error(`${m.members_errors_couldntUploadFile()}: ${errMsg}`);
  }
};
