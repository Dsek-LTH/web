import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

const CURRENT_YEAR = new Date().getFullYear();

const getExtensionOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1);
};
const prepareNameForFilesystem = (name: string, fileName: string) =>
  name.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "") + // replaces spaces with "_" and removes all special characters
  getExtensionOfFile(fileName);

export const load: PageServerLoad = async ({ parent, url }) => {
  const { session } = await parent();
  const year = url.searchParams.get("year") ?? CURRENT_YEAR;
  const files = await fileHandler.getInBucket(
    session?.user,
    PUBLIC_BUCKETS_DOCUMENTS,
    `${year}/`,
    false,
  );
  const form = await superValidate(uploadSchema);
  return {
    files,
    form,
  };
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
    const formData = await request.formData();
    const form = await superValidate(formData, uploadSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
      session?.user,
      async () => {
        const { folder, name, year, type } = form.data;
        const file = formData.get("file");
        if (!file || !(file instanceof File) || file.size <= 0) {
          return setError(form, "file", "Felaktig fil");
        }

        const formattedName = prepareNameForFilesystem(name, file.name);
        const folderPath = `${type}/${year}/${folder}`;
        // await prisma.meeting.upsert({
        //   where: { url: folderPath },
        //   update: {},
        //   create: { title: meeting, date, url: folderPath },
        // });

        const filePath = `${folderPath}/${formattedName}`;
        const putUrl = await fileHandler.getPresignedPutUrl(
          session?.user,
          PUBLIC_BUCKETS_DOCUMENTS,
          filePath,
        );
        const res = await fetch(putUrl, {
          method: "PUT",
          body: file,
        });
        if (!res.ok)
          return message(
            form,
            {
              message: `Kunde inte ladda upp fil: ${res.statusText}`,
              type: "error",
            },
            { status: 500 },
          );
        return message(form, {
          message: "Fil uppladdad",
          type: "success",
        });
      },
      form,
    );
  },
};
