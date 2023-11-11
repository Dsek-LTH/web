export default async function servePdf(
  pathName: string | undefined,
  setHeaders: (headers: Record<string, string>) => void
) {
  if (typeof pathName !== "string" || !/^[\w/.-]+$/.test(pathName)) {
    return new Response("Invalid path name", {
      status: 400,
    });
  } else {
    const fileName = pathName.split("/").pop();
    const url = new URL(pathName, "https://github.com/Dsek-LTH/");
    const fetchResponse = await fetch(url);
    const buffer = await fetchResponse.arrayBuffer();

    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    };

    setHeaders(headers);

    return new Response(buffer, {
      headers,
      status: 200,
    });
  }
}

export function displayPdf(pathName: string | undefined) {
  return `/api/pdf/${encodeURIComponent(pathName ?? "")}`;
}
