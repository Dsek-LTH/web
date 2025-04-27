import { error, type NumericRange } from "@sveltejs/kit";

/**
 * Returns a URL to a file on github.
 * @param pathName relative path to the pdf file on github
 * @returns absolute URL to the file on github
 */
function getGitHubUrl(pathName: string) {
  return new URL(pathName, "https://github.com/Dsek-LTH/");
}

/**
 * Fetch a PDF file from the Dsek-LTH GitHub and serve it.
 *
 * We don't serve PDFs straight from GitHub because then they can't be
 * displayed directly in the browser (they would be downloaded instead).
 * @param pathName relative path to the pdf file on github
 * @returns PDF file
 */
export default async function servePdf(pathName: string) {
  // match only alphanumeric characters, forward slashes, dots, and dashes
  if (/^[\w/.-]+$/.test(pathName)) {
    const url = getGitHubUrl(pathName);
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      error(
        fetchResponse.status as NumericRange<400, 599>, // This is very likely if !fetchResponse.ok
        fetchResponse.statusText,
      );
    }

    // GitHub returns a 200 OK if we happen to request another resource that exists, i.e a repository,
    // so we need to check the content type to make sure we got a PDF (or at least a file).
    const contentType = fetchResponse.headers.get("content-type");
    if (!contentType?.startsWith("application/octet-stream")) {
      error(404, "Not Found");
    }

    const buffer = await fetchResponse.arrayBuffer();
    const fileName = pathName.split("/").pop();
    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    };
    return new Response(buffer, {
      headers,
      status: 200,
    });
  } else {
    error(400, "Bad Request");
  }
}

export function getPdfApiUrl(pathName: string) {
  return `/api/pdf/${pathName}`;
}
