import { api, multipart } from "$lib/api/client";
import type { UploadSchema } from "./types";

// Forwards to the Go backend (backend/internal/gallery.Service.UploadAlbum)
// instead of touching MinIO directly - see backend/CLAUDE.md's Phase 4
// section. Go now awaits every file upload before returning, fixing the
// old fire-and-forget bug this function used to have.
export const uploadAlbumFiles = async (data: UploadSchema) => {
  const res = await api.POST("/gallery/upload", {
    body: { name: data.name, date: data.date, files: Array.from(data.files) },
    ...multipart,
  });
  if (res.error) throw new Error("Failed to upload album");
};
