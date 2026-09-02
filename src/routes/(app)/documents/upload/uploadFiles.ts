import { api } from "$lib/api/client";
import type { UploadSchema } from "./types";

// Forwards to the Go backend (backend/internal/documents.Service.Upload)
// instead of touching MinIO directly - see backend/CLAUDE.md's Phase 4
// section. Go resolves the bucket/prefix from `type`/`year`/`folder`
// itself (see ./helpers.ts's typeToPath, still used here only for the
// form's own path preview, not for any real storage call).
export const uploadDocumentsFile = async (data: UploadSchema) => {
  const { folder, name, year, type, file } = data;

  const form = new FormData();
  form.append("type", type);
  form.append("year", String(year));
  form.append("folder", folder);
  form.append("name", name);
  form.append("file", file);

  const res = await api.POST("/documents/upload", {
    body: form as unknown as {
      type: string;
      year: number;
      folder: string;
      name: string;
      file: string;
    },
  });
  if (res.error) throw new Error("Failed to upload document");
};
