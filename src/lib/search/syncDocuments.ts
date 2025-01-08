import { env } from "$env/dynamic/private";
import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
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
import { promiseAllInBatches } from "$lib/utils/batch";

/**
 * Syncs all governing documents
 * Governing documents have an entry in Prisma
 * So we fetch them from there
 */
export const syncGoverningDocuments = async () => {
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

  const governingDocumentsWithText: GoverningDocumentDataInMeilisearch[] =
    await promiseAllInBatches(
      governingDocuments,
      async (document) => {
        // Fetch the content of the document
        const content = await getFileContent(document.url);
        // If the fetch was successful, add the document to the result
        if (content) {
          return {
            ...document,
            content,
            id: prismaIdToMeiliId(document.id),
          };
        }
      },
      5,
    ).then((documents) =>
      documents.filter((document) => document !== undefined),
    );

  await addDataToIndex(documentsIndex, governingDocumentsWithText);
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
  // This is a hack to get the files from the public bucket
  // since the fileHandler checks for the user's policies
  // and we don't have a user here
  const fileUser: AuthUser = {
    roles: [""],
    policies: [apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).READ],
  };

  const files = await fileHandler.getInBucket(
    fileUser,
    PUBLIC_BUCKETS_DOCUMENTS,
    "",
    true,
  );
  const indexName: SearchableIndex = "meetingDocuments";
  const documentsIndex = await meilisearch.getIndex(indexName);
  await resetIndex(documentsIndex, meilisearchConstants.meetingDocument);

  const meetingDocumentsWithText: MeetingDocumentDataInMeilisearch[] =
    await promiseAllInBatches(
      files,
      async (file) => {
        if (file.thumbnailUrl) {
          const content = await getFileContent(file.thumbnailUrl);
          if (content) {
            return {
              id: prismaIdToMeiliId(file.id),
              title: file.name,
              content,
              url: file.thumbnailUrl,
            };
          }
        }
      },
      5,
    ).then((documents) =>
      documents.filter((document) => document !== undefined),
    );

  await addDataToIndex(documentsIndex, meetingDocumentsWithText);
  await setRulesForIndex(documentsIndex, meilisearchConstants.meetingDocument);
};

const getFileContent = async (url: string) => {
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
    const popplerResponse = await pdfToText(buffer);
    console.log(
      `Poppler: Received content from ${url} from Poppler server. Took ${new Date().getTime() - now.getTime()} ms`,
    );
    // Filter the content to remove unnecessary characters
    return filterContent(popplerResponse);
  } catch (error) {
    console.log(`Failed to fetch from ${url}: ${error}`);
  }
};

const pdfToText = async (buffer: ArrayBuffer) => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: "application/pdf" }),
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
