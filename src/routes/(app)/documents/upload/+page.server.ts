import { fileHandler } from "$lib/files";
import { fail } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { typeToPath } from "./helpers";

const CURRENT_YEAR = new Date().getFullYear();

const getExtensionOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1);
};
const prepareNameForFilesystem = (name: string, fileName: string) =>
  name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "") + // replaces spaces with "_" and removes all special characters
  getExtensionOfFile(fileName);

export const load: PageServerLoad = async () => {
  const form = await superValidate(uploadSchema);
  return { form };
};

const uploadSchema = z.object({
  type: z.enum(["meeting", "srd", "requirement"]).default("meeting"),
  folder: z.string().default(""),
  name: z.string().default(""),
  year: z
    .number()
    .min(1962)
    .max(CURRENT_YEAR + 1)
    .default(CURRENT_YEAR),
  file: z.any(),
});
export type UploadSchema = typeof uploadSchema;

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { user } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, uploadSchema);
    if (!form.valid) return fail(400, { form });
    const { folder, name, year, type } = form.data;
    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size <= 0) {
      return setError(form, "file", m.documents_errors_erroneousFile());
    }

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
    if (!res.ok)
      return message(
        form,
        {
          message: m.documents_errors_couldNotUploadFile({ x: res.statusText }),
          type: "error",
        },
        { status: 500 },
      );
    return message(form, {
      message: m.documents_fileUploaded(),
      type: "success",
    });
  },
};
