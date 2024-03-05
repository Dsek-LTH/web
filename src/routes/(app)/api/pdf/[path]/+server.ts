import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, setHeaders, fetch }) => {
  const path = params.path;
  if (!path) {
    return new Response("No path provided", {
      status: 400,
    });
  }
  const response = await fetch(path);
  const fileName = path.split("/").pop();
  if (!response.ok) {
    return new Response(response.statusText, {
      status: response.status,
    });
  }
  const buffer = await response.arrayBuffer();
  setHeaders({
    "Content-Disposition": `filename="${fileName}"`,
  });
  return new Response(buffer, {
    status: 200,
  });
};
