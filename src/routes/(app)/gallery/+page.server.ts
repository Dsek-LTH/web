import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;

  const files: FileData[] = await fileHandler
    .getInBucket(user, PUBLIC_BUCKETS_ALBUMS, "public/", true)
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

  /*filteredFiles = files.filter((file) => {
    const fileParts = file.id.split("/");
    const meeting = fileParts[fileParts.length - 2] ?? m.documents_unknown();
    return (
      !meeting.startsWith("HTM") &&
      !meeting.startsWith("VTM") &&
      !meeting.startsWith("S") &&
      //meeting != year.toString()
    );
  });*/
  const filesGroupedByAlbum = files.reduce<Record<string, FileData[]>>(
    (acc, file) => {
      const fileParts = file.id.split("/");
      const album = fileParts[fileParts.length - 2] ?? "unknown";
      if (!acc[album]) acc[album] = [];
      acc[album]!.push(file);
      return acc;
    },
    {},
  );

  //console.log(filesGroupedByAlbum);
  const albumEntries = Object.entries(filesGroupedByAlbum);
  return {
    albums: albumEntries,
  };
};

/*const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;
*/
/*export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_DOCUMENTS, [id]);
    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};
*/
