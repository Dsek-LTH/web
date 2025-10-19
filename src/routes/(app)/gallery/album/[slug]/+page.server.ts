import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";

import * as m from "$paraglide/messages";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = locals;
  const album = params.slug;
  console.log("slug: " + album);

  const pictures: FileData[] = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_ALBUMS,
      "public/" + album.split("-")[0] + "/" + album,
      true,
    )
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

  return {
    pictures: pictures,
    //deleteForm: await superValidate(zod(deleteSchema)),
  };
};
/*
const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;*/

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
