// Page to upload files to the server and get a link back

import { serverApi } from "$lib/server/apiClient";
import * as m from "$paraglide/messages";
import { fail, message, superValidate, withFiles } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { v4 as uuid } from "uuid";
import { z } from "zod";

const MISCELLANEOUS_FILES_PREFIX = `public/miscellaneous`;

// fileHandler:files:read/create/delete (Go's apinames.FileFiles*) are
// enforced by Go itself now (internal/documents.Service's ListMisc/
// UploadMisc/DeleteMisc) - no authorize() call here, matching DESIGN.md's
// Principle #5.

export const load = async (event) => {
  const res = await serverApi(event).GET("/admin/files", {});
  if (res.error) {
    // Matches the old load's own fileHandler.getInBucket(...).catch(...) -
    // a storage error shouldn't fail the whole page, just leave the list
    // empty.
    console.error("Error fetching files", res.error);
  }
  return {
    files: res.data ?? [],
    uploadForm: await superValidate(zod4(uploadSchema)),
    deleteForm: await superValidate(zod4(deleteSchema)),
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
  upload: async (event) => {
    const form = await superValidate(event.request, zod4(uploadSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { file, fileName, prefix } = form.data;

    const body = new FormData();
    body.append("file", file);
    body.append("name", fileName);
    body.append("prefix", prefix);
    const res = await serverApi(event).POST("/admin/files", {
      body: body as unknown as { file: string; name: string; prefix: string },
    });
    if (res.error) {
      return message(
        form,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: 500 },
      );
    }
    form.data.fileUrl = res.data.url;

    form.data.file = null as unknown as File; // will work, but not type correct
    form.data.fileName = "";
    return message(form, {
      message: m.documents_fileUploaded(),
      type: "success",
    });
  },
  delete: async (event) => {
    const form = await superValidate(event.request, zod4(deleteSchema));
    if (!form.valid) return fail(400, form);

    const res = await serverApi(event).DELETE("/admin/files", {
      params: { query: { id: form.data.id } },
    });
    if (res.error) {
      return message(
        form,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: 500 },
      );
    }

    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};
