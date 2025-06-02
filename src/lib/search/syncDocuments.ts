import { env } from "$env/dynamic/private";
import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import servePdf from "$lib/utils/servePdf";
import { error, type NumericRange } from "@sveltejs/kit";
import { meilisearch } from "./meilisearch";
import {
  meilisearchConstants,
  type GoverningDocumentDataInMeilisearch,
  type MeetingDocumentDataInMeilisearch,
  type SearchableIndex,
} from "./searchTypes";
import { addDataToIndex, resetIndex, setRulesForIndex } from "./syncHelpers";
import { prismaIdToMeiliId } from "./searchHelpers";
import { fileHandler } from "$lib/files";
import type { AuthUser } from "@zenstackhq/runtime";
import apiNames from "$lib/utils/apiNames";
import { convert } from "html-to-text";

const batchSize = 10;

/**
 * Syncs all governing documents (from Prisma)
 */
export const syncGoverningDocuments = async () => {
  if (!(await checkPopplerHealth())) {
    console.warn(
      "Meilisearch: Poppler is not healthy, skipping sync of governing documents",
    );
    return;
  }

  const indexName: SearchableIndex = "governingDocuments";
  const documentsIndex = await meilisearch.getIndex(indexName);
  await resetIndex(documentsIndex, meilisearchConstants.governingDocument);

  const governingDocuments = await authorizedPrismaClient.document.findMany({
    select: { id: true, title: true, type: true, url: true },
    where: { deletedAt: null },
  });

  await processInBatches(governingDocuments, batchSize, async (docsBatch) => {
    const data: GoverningDocumentDataInMeilisearch[] = await Promise.all(
      docsBatch.map(async (document) => {
        if (!document.url) {
          console.warn(
            `Meilisearch: Document ${document.title} does not have a URL, skipping`,
          );
          return null;
        }
        const content = await getFileContentOrNull(
          document.url,
          document.title,
        );
        if (!content) {
          console.warn(
            `Meilisearch: Failed to fetch content for document ${document.title}, skipping`,
          );
          return null;
        }
        return { ...document, content, id: prismaIdToMeiliId(document.id) };
      }),
    ).then((docs) => docs.filter((doc) => doc !== null));
    if (data.length !== 0) await addDataToIndex(documentsIndex, data);
  });

  await setRulesForIndex(
    documentsIndex,
    meilisearchConstants.governingDocument,
  );
};

/**
 * Syncs all meeting documents (from MinIO public bucket)
 */
export const syncMeetingDocuments = async () => {
  // If Poppler is not up (for some reason), we can't continue, just return
  if (!(await checkPopplerHealth())) {
    console.warn(
      "Meilisearch: Poppler is not healthy, skipping sync of meeting documents",
    );
    return;
  }
  // This is a hack to get the files from the public bucket
  // since the fileHandler checks for the user's policies
  // and we don't have a user here
  const fileUser: AuthUser = {
    roles: [""],
    policies: [apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).READ],
  };

  const files = await fileHandler
    .getInBucket(fileUser, PUBLIC_BUCKETS_DOCUMENTS, "", true)
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

  const indexName: SearchableIndex = "meetingDocuments";
  const documentsIndex = await meilisearch.getIndex(indexName);
  await resetIndex(documentsIndex, meilisearchConstants.meetingDocument);

  await processInBatches(files, batchSize, async (filesBatch) => {
    const data: MeetingDocumentDataInMeilisearch[] = await Promise.all(
      filesBatch.map(async (file) => {
        if (!file.thumbnailUrl) {
          console.warn(
            `Meilisearch: File ${file.name} does not have a thumbnail URL, skipping`,
          );
          return null;
        }
        const content = await getFileContentOrNull(
          file.thumbnailUrl,
          file.name,
        );
        if (!content) {
          console.warn(
            `Meilisearch: Failed to fetch content for file ${file.name}, skipping`,
          );
          return null;
        }
        return {
          id: prismaIdToMeiliId(file.id),
          title: file.name ?? "",
          content: content ?? "",
          url: file.thumbnailUrl ?? "",
        };
      }),
    ).then((docs) => docs.filter((doc) => doc !== null));
    if (data.length != 0) await addDataToIndex(documentsIndex, data);
  });

  await setRulesForIndex(documentsIndex, meilisearchConstants.meetingDocument);
};

/**
 * Batch processor utility
 */
async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processBatch: (batch: T[]) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    await processBatch(items.slice(i, i + batchSize));
  }
}

/**
 * Fetches and extracts file content based on file type
 */
const getFileContentOrNull = async (
  url: string,
  fileName: string,
): Promise<string | null> => {
  if (!url) {
    console.warn(`Meilisearch: No URL provided for ${fileName}, skipping`);
    return null;
  }
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return await getPDFContent(url, fileName);
  if (ext === "html" || ext === "htm") return await getHTMLContent(url);
  if (ext === "txt") return await getTxtContent(url);
  console.warn(
    `Meilisearch: Unsupported file type for name: ${fileName}, url: ${url}, skipping`,
  );
  return null;
};

/**
 * Extracts text from a PDF file using Poppler server
 */
const getPDFContent = async (url: string, fileName: string) => {
  try {
    console.log(`Poppler: Fetching PDF from ${url}`);
    // If the URL starts with "styrdokument", "policys", "reglemente", "stadgar"
    // or "riktlinjer", we should fetch the document from the GitHub repository.
    // Needs to be updated if the repository changes name
    const pdfResponse = url.match(
      /^(styrdokument|policys|reglemente|stadgar|riktlinjer)/,
    )
      ? await servePdf(url)
      : await fetch(url);

    if (!pdfResponse.ok) {
      throw error(
        pdfResponse.status as NumericRange<400, 599>,
        pdfResponse.statusText,
      );
    }
    if (
      !pdfResponse.headers.get("content-type")?.startsWith("application/pdf")
    ) {
      // 415 Unsupported Media Type
      throw error(415, `Not a PDF: ${url}`);
    }

    const buffer = await pdfResponse.arrayBuffer();
    const now = Date.now();
    const popplerResponse = await pdfToText(buffer, fileName);
    console.log(
      `Poppler: Received content from ${url} from Poppler server. Took ${Date.now() - now} ms`,
    );
    return filterContent(popplerResponse);
  } catch (err) {
    console.error(`Failed to fetch from ${url}: ${err}`);
    return null;
  }
};

/**
 * Sends PDF buffer to Poppler server for text extraction
 */
const pdfToText = async (buffer: ArrayBuffer, fileName: string) => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: "application/pdf" }),
    fileName,
  );
  const popplerResponse = await fetch(env.POPPLER_SERVER_URL, {
    method: "POST",
    body: formData,
  });
  if (!popplerResponse.ok) {
    throw error(
      popplerResponse.status as NumericRange<400, 599>,
      popplerResponse.statusText,
    );
  }
  return await popplerResponse.text();
};

/**
 * Extracts and cleans text from HTML file
 */
const getHTMLContent = async (url: string) => {
  try {
    console.log(`Fetching HTML content from ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw error(
        response.status as NumericRange<400, 599>,
        response.statusText,
      );
    }
    const html = await response.text();
    const textContent = convert(html, { wordwrap: false });
    return filterContent(textContent);
  } catch (err) {
    console.error(`Failed to fetch from ${url}: ${err}`);
    return null;
  }
};

/**
 * Extracts and cleans text from TXT file
 */
const getTxtContent = async (url: string) => {
  try {
    console.log(`Fetching TXT content from ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw error(
        response.status as NumericRange<400, 599>,
        response.statusText,
      );
    }
    const text = await response.text();
    return filterContent(text);
  } catch (err) {
    console.error(`Failed to fetch from ${url}: ${err}`);
    return null;
  }
};

/**
 * Cleans up extracted content for indexing
 */
const filterContent = (content: string) => {
  // Our LaTeX template generates some characters
  // in the header that we don't need in the search index
  // Also, they are not standard characters, so they are
  // not likely to be used in the search queries
  // These characters are "sektionögalud", but in a weird font
  // So the editor you are using might not show them correctly
  const charsToRemove = new Set([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  content = Array.from(content)
    .filter((char) => !charsToRemove.has(char))
    .join("");

  // This happens in our LaTeX template headers, remove
  content = content.replace(/-?\s*D\s*(T\s*L|L\s*T)/g, "");

  // This pattern also occurs in headers, remove
  content = content.replace(/D-SEKTIONEN INOM TLTH\n\s*H\s*\n/g, "");

  // Trim all lines, remove leading and trailing whitespace
  content = content.replace(/[^\S\r\n]+\n/g, "\n");

  // If there are two or more empty lines, replace them with one empty line
  // Do this twice to make sure we don't have more than two empty lines
  content = content.replace(/\n{2,}/g, "\n");
  return content;
};

/**
 * Checks if Poppler server is healthy
 */
const checkPopplerHealth = async () => {
  if (!env.POPPLER_SERVER_URL) {
    console.error(
      "Poppler: No server URL provided. Check the environment variables",
    );
    return false;
  }
  try {
    const response = await fetch(env.POPPLER_SERVER_URL + "/health", {
      method: "GET",
      signal: AbortSignal.timeout(5000), // Timeout after 5 seconds
    });
    if (!response.ok) {
      console.warn(
        `Poppler: Server is not healthy: ${response.status} ${response.statusText}`,
      );
      return false;
    }
    console.log("Poppler: Server is healthy");
    return true;
  } catch (err) {
    console.error(`Poppler: Server is not healthy: ${err}`);
    return false;
  }
};
