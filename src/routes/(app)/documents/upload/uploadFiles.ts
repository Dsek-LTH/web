import { api, multipart } from "$lib/api/client";
import type { UploadSchema } from "./types";

// Forwards to the Go backend (backend/internal/documents.Service.Upload)
// instead of touching MinIO directly - see backend/CLAUDE.md's Phase 4
// section. Go resolves the bucket/prefix from the endpoint/`year`/`folder`
// itself (see ./helpers.ts's typeToPath, still used here only for the
// form's own path preview, not for any real storage call).
export const uploadDocumentsFile = async (data: UploadSchema) => {
  const { folder, name, year, type, file } = data;

  const res =
    type === "requirement"
      ? await api.POST("/requirement-profiles", {
          body: { year, folder, name, file },
          ...multipart,
        })
      : await api.POST("/meeting-documents", {
          body: { type, year, folder, name, file },
          ...multipart,
        });
  if (res.error) throw new Error("Failed to upload document");
};
