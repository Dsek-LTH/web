import { fileHandler } from "$lib/files";
import type { AuthUser } from "@zenstackhq/runtime";
import { typeToPath } from "./helpers";
import type { UploadSchema } from "./types";

const getExtensionOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1);
};
const prepareNameForFilesystem = (name: string, fileName: string) =>
  name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "") + // replaces spaces with "_" and removes all special characters
  getExtensionOfFile(fileName);

export const uploadFile = async (user: AuthUser, data: UploadSchema) => {
  const { folder, name, year, type, file } = data;

  const formattedName = prepareNameForFilesystem(name, file.name);
  const { path, bucket } = typeToPath[type];
  // await prisma.meeting.upsert({
  //   where: { url: folderPath },
  //   update: {},
  //   create: { title: meeting, date, url: folderPath },
  // });

  const filePath = `${path(year, folder)}/${formattedName}`;
  const putUrl = await fileHandler.getPresignedPutUrl(user, bucket, filePath);
  const res = await fetch(putUrl, {
    method: "PUT",
    body: file,
  });
  return res;
};
