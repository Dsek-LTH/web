import { getFullName } from "$lib/utils/client/member";
import dayjs from "dayjs";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import type { ExpandedExpenseForPdf } from "./sendToBookkeeping";

const A4_SIZE: [number, number] = [595.276, 841.89];
const MARGIN = 50;
const TABLE_HEADERS = [
  "Cost Center",
  "Amount",
  "Comment",
  "Signed By",
  "Date Signed",
];
const TABLE_COL_WIDTHS = [100, 80, 150, 100, 100];

/**
 * Fetches a file from a URL and returns it as a Uint8Array
 */
async function fetchFileAsBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Determines if a URL points to a PDF file
 */
function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf") || url.includes("pdf");
}

/**
 * Determines if a URL points to an image file
 */
function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.includes("image")
  );
}

async function drawHeader(page: PDFPage, fonts: { bold: PDFFont }) {
  const { height } = page.getSize();
  page.drawText("D-sektionen Expense Report", {
    x: MARGIN,
    y: height - MARGIN,
    size: 24,
    font: fonts.bold,
  });
}

async function drawExpenseInfo(
  page: PDFPage,
  expense: ExpandedExpenseForPdf,
  fonts: { regular: PDFFont; bold: PDFFont },
) {
  const { height } = page.getSize();
  const startY = height - 100;
  const rightCol = 300;

  // Left column
  page.drawText("Expense Details", {
    x: MARGIN,
    y: startY,
    size: 14,
    font: fonts.bold,
  });

  const leftDetails = [
    `ID: ${expense.id}`,
    `Date: ${dayjs(expense.date).format("YYYY-MM-DD")}`,
    `Description: ${expense.description}`,
    `Type: ${expense.isGuildCard ? "Guild Card" : "Private Expense"}`,
  ];

  leftDetails.forEach((text, i) => {
    page.drawText(text, {
      x: MARGIN,
      y: startY - 25 * (i + 1),
      size: 12,
      font: fonts.regular,
    });
  });

  // Right column
  page.drawText("Member Information", {
    x: rightCol,
    y: startY,
    size: 14,
    font: fonts.bold,
  });

  page.drawText(`Name: ${getFullName(expense.member)}`, {
    x: rightCol,
    y: startY - 25,
    size: 12,
    font: fonts.regular,
  });

  return startY - 130; // Return Y position for table start
}

async function drawItemsTable(
  page: PDFPage,
  items: ExpandedExpenseForPdf["items"],
  startY: number,
  fonts: { regular: PDFFont; bold: PDFFont },
): Promise<{ page: PDFPage; endY: number }> {
  const { height } = page.getSize();
  let currentY = startY;
  let currentPage = page;

  // Draw table header
  currentPage.drawText("Expense Items", {
    x: MARGIN,
    y: currentY + 20,
    size: 14,
    font: fonts.bold,
  });

  let currentX = MARGIN;
  TABLE_HEADERS.forEach((header, i) => {
    currentPage.drawText(header, {
      x: currentX,
      y: currentY,
      size: 12,
      font: fonts.bold,
    });
    currentX += TABLE_COL_WIDTHS[i]!;
  });

  currentY -= 20;

  // Draw items
  for (const [i, item] of items.entries()) {
    if (currentY < 50) {
      currentPage = currentPage.doc.addPage(A4_SIZE);
      currentY = height - MARGIN;
    }

    currentX = MARGIN;

    // Draw each column
    const columns = [
      `${i + 1}: ${item.costCenter}`,
      `${(item.amount / 100).toFixed(2)} SEK`,
      item.comment || "-",
      item.signedBy ? getFullName(item.signedBy) : "-",
      item.signedAt ? dayjs(item.signedAt).format("YYYY-MM-DD") : "-",
    ];

    columns.forEach((text, i) => {
      currentPage.drawText(text, {
        x: currentX,
        y: currentY,
        size: 10,
        font: fonts.regular,
        maxWidth: TABLE_COL_WIDTHS[i],
      });
      currentX += TABLE_COL_WIDTHS[i]!;
    });

    currentY -= 20;
  }

  return { page: currentPage, endY: currentY };
}

async function embedReceipt(
  doc: PDFDocument,
  receiptUrl: string,
): Promise<void> {
  const fileBytes = await fetchFileAsBytes(receiptUrl);

  if (isPdfUrl(receiptUrl)) {
    const existingPdf = await PDFDocument.load(fileBytes);
    const copiedPages = await doc.copyPages(
      existingPdf,
      existingPdf.getPageIndices(),
    );
    copiedPages.forEach((page) => doc.addPage(page));
    return;
  }

  if (!isImageUrl(receiptUrl)) {
    throw new Error("Unsupported receipt file type");
  }

  const page = doc.addPage(A4_SIZE);
  const { width, height } = page.getSize();

  // Convert image to JPEG if needed and embed
  const image = await doc.embedJpg(fileBytes).catch(() =>
    sharp(fileBytes)
      .rotate()
      .jpeg()
      .toBuffer()
      .then((buffer) => doc.embedJpg(new Uint8Array(buffer))),
  );

  // Calculate dimensions to fit the image on the page
  const pageWidth = width - MARGIN * 2;
  const pageHeight = height - 150;
  const imageRatio = image.width / image.height;

  let finalWidth = pageWidth;
  let finalHeight = pageWidth / imageRatio;

  if (finalHeight > pageHeight) {
    finalHeight = pageHeight;
    finalWidth = pageHeight * imageRatio;
  }

  // Center the image
  const x = (width - finalWidth) / 2;
  const y = (height - finalHeight - 100) / 2;

  page.drawImage(image, { x, y, width: finalWidth, height: finalHeight });
}

/**
 * Generates a PDF document for an expense
 */
export async function generateExpensePdf(
  expense: ExpandedExpenseForPdf,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdfDoc.addPage(A4_SIZE);

  // Draw the main expense document
  await drawHeader(page, { bold: fonts.bold });
  const tableStartY = await drawExpenseInfo(page, expense, fonts);
  const { page: lastPage, endY } = await drawItemsTable(
    page,
    expense.items,
    tableStartY,
    fonts,
  );

  // Draw total amount
  const totalAmount = expense.items.reduce((sum, item) => sum + item.amount, 0);
  lastPage.drawText(`Total Amount: ${(totalAmount / 100).toFixed(2)} SEK`, {
    x: MARGIN,
    y: endY - 20,
    size: 14,
    font: fonts.bold,
  });

  // Add receipts
  for (const item of expense.items) {
    if (!item.receiptUrl) continue;
    try {
      await embedReceipt(pdfDoc, item.receiptUrl);
    } catch (error) {
      const errorPage = pdfDoc.addPage(A4_SIZE);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errorPage.drawText(errorMessage, {
        x: MARGIN,
        y: errorPage.getHeight() - 100,
        size: 12,
        font: fonts.regular,
        color: rgb(1, 0, 0),
      });
      errorPage.drawText(`Receipt link: ${item.receiptUrl}`, {
        x: MARGIN,
        y: errorPage.getHeight() - 120,
        size: 12,
        font: fonts.regular,
      });
    }
  }

  return pdfDoc.save();
}
