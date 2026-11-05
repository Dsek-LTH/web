import { multipart } from "$lib/api/client";
import type { serverApi } from "$lib/server/apiClient";
import type { UploadSchema } from "./types";

// Forwards to the Go backend (apps/api/internal/gallery.Service.UploadAlbum)
// instead of touching MinIO directly. Go now awaits every file upload before returning, fixing the
// old fire-and-forget bug this function used to have.
export const uploadAlbumFiles = async (
  api: ReturnType<typeof serverApi>,
  data: UploadSchema,
) => {
  const res = await api.POST("/albums", {
    body: { name: data.name, date: data.date, files: Array.from(data.files) },
    ...multipart,
  });
  if (res.error) throw new Error(res.error.detail ?? "Failed to upload album");
};
