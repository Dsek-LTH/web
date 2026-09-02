import { api } from "$lib/api/client";
import type { UploadSchema } from "./types";

// Forwards to the Go backend (backend/internal/gallery.Service.UploadAlbum)
// instead of touching MinIO directly - see backend/CLAUDE.md's Phase 4
// section. Go now awaits every file upload before returning, fixing the
// old fire-and-forget bug this function used to have.
export const uploadAlbumFiles = async (data: UploadSchema) => {
  const form = new FormData();
  form.append("name", data.name);
  form.append("date", data.date);
  Array.from(data.files).forEach((file) => form.append("files", file));

  const res = await api.POST("/gallery/upload", {
    body: form as unknown as { name: string; date: string; files: string[] },
  });
  if (res.error) throw new Error("Failed to upload album");
};
