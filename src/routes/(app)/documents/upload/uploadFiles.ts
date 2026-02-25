import { uploadFile } from "$lib/files/uploadFiles";
import type { AuthUser } from "@zenstackhq/runtime";
import { typeToPath } from "./helpers";
import type { UploadSchema } from "./types";

export const uploadDocumentsFile = async (
	user: AuthUser,
	data: UploadSchema,
) => {
	const { folder, name, year, type, file } = data;

	const { path, bucket } = typeToPath[type];
	const prefix = path(year, folder);
	// await prisma.meeting.upsert({
	//   where: { url: folderPath },
	//   update: {},
	//   create: { title: meeting, date, url: folderPath },
	// });
	return uploadFile(user, file, prefix, bucket, name);
};
