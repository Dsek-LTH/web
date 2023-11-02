import { fileHandler } from "$lib/files";
import { fail } from "@sveltejs/kit";

export const load = async ({ parent, url }) => {
  const { session } = await parent();
  const year = url.searchParams.get("year") ?? new Date().getFullYear();
  const files = await fileHandler.getInBucket(session?.user, "documents", `${year}/`, false);
  return {
    files,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const session = await locals.getSession();
    const formData = await request.formData();
    const failWithData = (error: string) => {
      // in case of an error return the data and errors
      formData.delete("files"); // not serializable
      const data = {
        data: Object.fromEntries(formData),
        error,
      };
      return fail(400, data);
    };
    const meeting = formData.get("meeting");
    if (!meeting || typeof meeting !== "string") return failWithData("Meeting is required");
    const name = formData.get("name");
    if (!name || typeof name !== "string") return failWithData("Name is required");
    const year = formData.get("year") ?? new Date().getFullYear();
    const file = formData.getAll("files")[0];
    if (!file || !(file instanceof File)) return failWithData("File is required");
    const formattedName =
      String(name)
        .replace(/\s/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "") + file.name.slice(file.name.lastIndexOf("."));
    const path = `${year}/${meeting}/${formattedName}`;
    try {
      const putUrl = await fileHandler.getPresignedPutUrl(session?.user, "documents", path);
      await fetch(putUrl, {
        method: "PUT",
        body: file,
      });
      formData.delete("files"); // not serializable
      formData.delete("name"); // to edit
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e: any) {
      if ("body" in e && "message" in e.body) {
        return failWithData(e.body.message as string);
      }
      return failWithData(String(e));
    }
  },
};
