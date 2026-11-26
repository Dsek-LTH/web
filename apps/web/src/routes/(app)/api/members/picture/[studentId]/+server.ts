import { serverApi } from "$lib/server/apiClient";
import type { RequestHandler } from "./$types";

// A member's avatar URL, as { picture } (undefined if they have none or
// can't be looked up).
export const GET: RequestHandler = async (event) => {
  const res = await serverApi(event).GET("/members/{studentId}", {
    params: { path: { studentId: event.params.studentId } },
  });
  return new Response(JSON.stringify({ picture: res.data?.picturePath }));
};
