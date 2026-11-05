import { updateGroupMap } from "$lib/files/documentGroups";
import { uploadFileWithKey } from "$lib/files/uploadFiles";
import apiNames from "$lib/utils/apiNames";
import type { AuthUser } from "@zenstackhq/runtime";
import { getMeetingFileKey } from "../grouping";
import { typeToPath } from "./helpers";
import type { UploadSchema } from "./types";

export const uploadDocumentsFile = async (
  user: AuthUser,
  data: UploadSchema,
) => {
  const { folder, group, name, year, type, file } = data;

  const { path, bucket } = typeToPath[type];
  const effectiveGroup = type === "requirement" ? "" : group;
  const meetingFolder = path(year, folder);
  // await prisma.meeting.upsert({
  //   where: { url: folderPath },
  //   update: {},
  //   create: { title: meeting, date, url: folderPath },
  // });
  const { url, key: uploadedKey } = await uploadFileWithKey(
    user,
    file,
    meetingFolder,
    bucket,
    name,
  );

  if (effectiveGroup) {
    const fileKey = getMeetingFileKey(uploadedKey, meetingFolder);
    await updateGroupMap(
      user,
      bucket,
      meetingFolder,
      (map) => {
        map[fileKey] = effectiveGroup;
        return true;
      },
      apiNames.FILES.BUCKET(bucket).CREATE,
    );
  }

  return url;
};
