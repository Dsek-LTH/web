import { env } from "$env/dynamic/private";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import servePdf from "$lib/utils/servePdf";
import { error, type NumericRange } from "@sveltejs/kit";
import { meilisearch } from "./meilisearch";
import {
  meilisearchConstants,
  type GoverningDocumentDataInMeilisearch,
  type SearchableIndex,
} from "./searchTypes";
import { addDataToIndex, resetIndex, setRulesForIndex } from "./syncHelpers";
import { prismaIdToMeiliId } from "./searchHelpers";

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
  const governingDocuments: GoverningDocumentDataInMeilisearch[] =
    await authorizedPrismaClient.document
      .findMany({
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
        },
        where: {
          deletedAt: null,
        },
      })
      .then(async (documents) => {
        const result = [];
        for (const document of documents) {
          // Fetch the content of the document
          const content = await getFileContent(document.url);
          // If the fetch was successful, add the document to the result
          if (content) {
            result.push({
              ...document,
              content,
              id: prismaIdToMeiliId(document.id),
            });
          }
        }
        return result;
      });

  await addDataToIndex(documentsIndex, governingDocuments);
  await setRulesForIndex(
    documentsIndex,
    meilisearchConstants.governingDocument,
  );
};

const getFileContent = async (url: string) => {
  try {
    let pdfResponse;
    // If the URL starts with "styrdokument", "policys", "reglemente" or "stadgar",
    // we should fetch the document from the GitHub repository
    if (url.match(/^(styrdokument|policys|reglemente|stadgar)/)) {
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
      throw error(
        pdfResponse.status as NumericRange<400, 599>,
        `Not a PDF: ${url}`,
      );
    }

    const buffer = await pdfResponse.arrayBuffer();
    // Send the PDF to the Poppler server to extract the text
    const popplerResponse = await pdfToText(buffer);
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
