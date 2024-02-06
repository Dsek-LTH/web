import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { PageServerLoad, Actions } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { FileData } from "$lib/files/fileHandler";
import { fail } from "@sveltejs/kit";

export type FolderType = {
  id: string;
  name: string;
  isFolder: boolean;
  url: string;
  files: FolderType[];
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const year = url.searchParams.get("year") || new Date().getFullYear();
  const files = await fileHandler.getInBucket(
    user,
    PUBLIC_BUCKETS_DOCUMENTS,
    "requirement/" + year,
    true,
  );
  const filesGroupedByFolder = files.reduce<Record<string, FileData[]>>(
    (acc, file) => {
      const fileParts = file.id.split("/");
      const folder =
        fileParts.slice(2, fileParts.length - 1).join("/") ?? "unknown";
      if (!acc[folder]) acc[folder] = [];
      acc[folder]!.push(file);
      return acc;
    },
    {},
  );
  console.log(filesGroupedByFolder);
  return {
    files,
    folders: filesGroupedByFolder,
    deleteForm: await superValidate(deleteSchema),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = typeof deleteSchema;

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_DOCUMENTS, [id]);
    return message(form, {
      message: "Fil borttagen",
      type: "success",
    });
  },
};
