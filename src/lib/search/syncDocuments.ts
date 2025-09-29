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

const batchSize = 10;

/**
 * Syncs all governing documents
 * Governing documents have an entry in Prisma
 * So we fetch them from there
 */
export const syncGoverningDocuments = async () => {
  // If Poppler is not up (for some reason), we can't continue, just return
  if (!(await checkPopplerHealth())) {
    console.log(
      "Meilisearch: Poppler is not healthy, skipping sync of governing documents",
    );
    return;
  }

  const indexName: SearchableIndex = "governingDocuments";
  const documentsIndex = await meilisearch.getIndex(indexName);
  await resetIndex(documentsIndex, meilisearchConstants.governingDocument);

  // In Prisma, we store our governing documents, which has a URL to the actual document.
  const governingDocuments = await authorizedPrismaClient.document.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
    },
    where: {
      deletedAt: null,
    },
  });

  for (let i = 0; i < governingDocuments.length; i += batchSize) {
    const docsBatch = governingDocuments.slice(i, i + batchSize);
    const data: GoverningDocumentDataInMeilisearch[] = await Promise.all(
      docsBatch.map(async (document) => {
        if (!document.url) {
          console.log(
            `Meilisearch: Document ${document.title} does not have a URL, skipping`,
          );
          return null;
        }
        const content = await getFileContent(document.url, document.title);
        if (!content) {
          console.log(
            `Meilisearch: Failed to fetch content for document ${document.title}, skipping`,
          );
          return null;
        }
        return {
          ...document,
          content,
          id: prismaIdToMeiliId(document.id),
        };
      }),
    ).then((docs) => docs.filter((doc) => doc !== null));

    await addDataToIndex(documentsIndex, data);
  }

  await setRulesForIndex(
    documentsIndex,
    meilisearchConstants.governingDocument,
  );
};

/**
 * Syncs all meeting documents
 * Meeting documents are stored in the public bucket on MinIO
 */
export const syncMeetingDocuments = async () => {
  // If Poppler is not up (for some reason), we can't continue, just return
  if (!(await checkPopplerHealth())) {
    console.log(
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

  for (let i = 0; i < files.length; i += batchSize) {
    const filesBatch = files.slice(i, i + batchSize);
    // Fetch content for each file in the batch in parallel
    const data: MeetingDocumentDataInMeilisearch[] = await Promise.all(
      filesBatch.map(async (file) => {
        if (!file.thumbnailUrl) {
          console.log(
            `Meilisearch: File ${file.name} does not have a thumbnail URL, skipping`,
          );
          return null; // Skip files without a thumbnail URL
        }
        const content = await getFileContent(
          file.thumbnailUrl ?? "",
          file.name,
        );
        if (!content) {
          console.log(
            `Meilisearch: Failed to fetch content for file ${file.name}, skipping`,
          );
          return null; // Skip files where content could not be fetched
        }
        return {
          id: prismaIdToMeiliId(file.id),
          title: file.name ?? "",
          content: content ?? "",
          url: file.thumbnailUrl ?? "",
        };
      }),
    ).then((docs) => docs.filter((doc) => doc !== null));

    // Add the data to the index for this batch and wait before continuing
    await addDataToIndex(documentsIndex, data);
  }

  await setRulesForIndex(documentsIndex, meilisearchConstants.meetingDocument);
};

const getFileContent = async (url: string, fileName: string) => {
  try {
    console.log(`Poppler: Fetching PDF from ${url}`);
    let pdfResponse;
    // If the URL starts with "styrdokument", "policys", "reglemente", "stadgar"
    // or "riktlinjer", we should fetch the document from the GitHub repository
    if (url.match(/^(styrdokument|policys|reglemente|stadgar|riktlinjer)/)) {
      pdfResponse = await servePdf(url);
    } else {
      pdfResponse = await fetch(url);
    }
    // Check that the response is OK
    if (!pdfResponse.ok) {
      throw error(
        pdfResponse.status as NumericRange<400, 599>,
        pdfResponse.statusText,
      );
    }

    // Check that the response is a PDF
    if (
      !pdfResponse.headers.get("content-type")?.startsWith("application/pdf")
    ) {
      // 415 Unsupported Media Type
      throw error(415, `Not a PDF: ${url}`);
    }
    console.log(
      `Poppler: Received PDF from ${url}. Sending it to Poppler to extract text`,
    );

    const buffer = await pdfResponse.arrayBuffer();
    // Send the PDF to the Poppler server to extract the text
    const now = new Date();
    const popplerResponse = await pdfToText(buffer, fileName);
    console.log(
      `Poppler: Received content from ${url} from Poppler server. Took ${new Date().getTime() - now.getTime()} ms`,
    );
    // Filter the content to remove unnecessary characters
    return filterContent(popplerResponse);
  } catch (error) {
    console.log(`Failed to fetch from ${url}: ${error}`);
  }
};

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

const checkPopplerHealth = async () => {
  if (!env.POPPLER_SERVER_URL) {
    console.log(
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
      console.log(
        `Poppler: Server is not healthy: ${response.status} ${response.statusText}`,
      );
      return false;
    } else {
      console.log("Poppler: Server is healthy");
      return true;
    }
  } catch (error) {
    console.log(`Poppler: Server is not healthy: ${error}`);
    return false;
  }
};
