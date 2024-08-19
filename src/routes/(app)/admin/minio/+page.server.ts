// Page to upload files to the server and get a link back

import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { fileHandler } from "$lib/files";
import { getFileUrl } from "$lib/files/images.js";
import { uploadFile } from "$lib/files/uploadFiles.js";
import * as m from "$paraglide/messages";
import { fail, message, superValidate, withFiles } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { v4 as uuid } from "uuid";
import { z } from "zod";

const MISCELLANEOUS_FILES_PREFIX = `public/miscellaneous`;

export const load = async ({ locals }) => {
  const { user } = locals;

  // access is checked in the fileHandler
  const files = await fileHandler.getInBucket(
    user,
    PUBLIC_BUCKETS_FILES,
    MISCELLANEOUS_FILES_PREFIX,
    true,
  );
  return {
    files,
    uploadForm: await superValidate(zod(uploadSchema)),
    deleteForm: await superValidate(zod(deleteSchema)),
    prefix: MISCELLANEOUS_FILES_PREFIX,
  };
};

const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: m.documents_errors_erroneousFile() })
    .refine((f) => f.size > 0, {
      message: m.documents_errors_erroneousFile(),
    }),
  fileName: z.string().default(uuid),
  fileUrl: z.string().url().nullable().default(null),
  prefix: z.string().default("/"),
});
const deleteSchema = z.object({
  id: z.string(),
});

export const actions = {
  upload: async ({ locals, request }) => {
    const form = await superValidate(request, zod(uploadSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { file, fileName, prefix } = form.data;
    const _prefix = `${MISCELLANEOUS_FILES_PREFIX}${prefix}`.replace("//", "/");

    try {
      const fileUrl = await uploadFile(
        locals.user,
        file,
        _prefix.endsWith("/") ? _prefix.slice(0, _prefix.length - 1) : _prefix,
        PUBLIC_BUCKETS_FILES,
        fileName,
        false,
      );
      form.data.fileUrl = getFileUrl(fileUrl) ?? null;
    } catch (e) {
      return message(
        form,
        {
          message: e instanceof Error ? e.message : `${e}`,
          type: "error",
        },
        { status: 500 },
      );
    }

    form.data.file = null as unknown as File; // will work, but not type correct
    form.data.fileName = "";
    return message(form, {
      message: m.documents_fileUploaded(),
      type: "success",
    });
  },
  delete: async ({ locals, request }) => {
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, form);

    const { id } = form.data;

    try {
      await fileHandler.remove(locals.user, PUBLIC_BUCKETS_FILES, [id]);
    } catch (e) {
      return message(
        form,
        {
          message: e instanceof Error ? e.message : `${e}`,
          type: "error",
        },
        { status: 500 },
      );
    }

    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};
