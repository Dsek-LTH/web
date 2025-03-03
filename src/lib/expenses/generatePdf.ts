import { getFullName } from "$lib/utils/client/member";
import dayjs from "dayjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import type { ExpandedExpenseForPdf } from "./sendToBookkeeping";

const A4_SIZE: [number, number] = [595.276, 841.89]; // A4 size in points

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

/**
 * Generates a PDF document for an expense
 */
export async function generateExpensePdf(
  expense: ExpandedExpenseForPdf,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(A4_SIZE); // A4 size
  const { /*  width,  */ height } = page.getSize();

  // Header
  page.drawText("D-sektionen Expense Report", {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBoldFont,
  });

  // Expense Info
  const startY = height - 100;
  const leftCol = 50;
  const rightCol = 300;

  // Left column
  page.drawText("Expense Details", {
    x: leftCol,
    y: startY,
    size: 14,
    font: helveticaBoldFont,
  });

  page.drawText(`ID: ${expense.id}`, {
    x: leftCol,
    y: startY - 25,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(`Date: ${dayjs(expense.date).format("YYYY-MM-DD")}`, {
    x: leftCol,
    y: startY - 45,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(`Description: ${expense.description}`, {
    x: leftCol,
    y: startY - 65,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(
    `Type: ${expense.isGuildCard ? "Guild Card" : "Private Expense"}`,
    {
      x: leftCol,
      y: startY - 85,
      size: 12,
      font: helveticaFont,
    },
  );

  // Right column
  page.drawText("Member Information", {
    x: rightCol,
    y: startY,
    size: 14,
    font: helveticaBoldFont,
  });

  page.drawText(`Name: ${getFullName(expense.member)}`, {
    x: rightCol,
    y: startY - 25,
    size: 12,
    font: helveticaFont,
  });

  // Items table
  const tableY = startY - 130;
  const tableHeaders = [
    "Cost Center",
    "Amount",
    "Comment",
    "Signed By",
    "Date Signed",
  ];
  const colWidths = [100, 80, 150, 100, 100];
  if (colWidths.length !== tableHeaders.length || colWidths.length < 4) {
    // we manually check index 3 later
    throw new Error(
      "Table headers and column widths must have the same length",
    );
  }
  let currentY = tableY;

  // Draw table header
  page.drawText("Expense Items", {
    x: leftCol,
    y: currentY + 20,
    size: 14,
    font: helveticaBoldFont,
  });

  let currentX = leftCol;
  tableHeaders.forEach((header, i) => {
    page.drawText(header, {
      x: currentX,
      y: currentY,
      size: 12,
      font: helveticaBoldFont,
    });
    currentX += colWidths[i]!;
  });

  // Draw items
  currentY -= 20;
  for (const [i, item] of expense.items.entries()) {
    if (currentY < 50) {
      // Add new page if we're running out of space
      currentY = height - 50;
      page = pdfDoc.addPage(A4_SIZE);
    }

    currentX = leftCol;
    // Cost Center
    page.drawText(`${i + 1}: ${item.costCenter}`, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
      maxWidth: colWidths[0]!,
    });
    currentX += colWidths[0]!;

    // Amount (convert from öre to SEK)
    page.drawText(`${(item.amount / 100).toFixed(2)} SEK`, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
      maxWidth: colWidths[1]!,
    });
    currentX += colWidths[1]!;

    // Comment
    const commentText =
      item.comment ||
      "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";
    const commentHeight =
      Math.ceil(commentText.length / (colWidths[2]! / 7)) * 10; // Estimate height based on text length
    page.drawText(commentText, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
      maxWidth: colWidths[2]!,
      lineHeight: 10,
    });
    currentX += colWidths[2]!;

    // Signed By
    const signerName = item.signedBy ? getFullName(item.signedBy) : "-";
    const signerHeight = Math.ceil(signerName.length / 15) * 10; // Estimate height based on name length
    page.drawText(signerName, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
      maxWidth: colWidths[3]!,
    });
    currentX += colWidths[3]!;

    // Date Signed
    page.drawText(
      item.signedAt ? dayjs(item.signedAt).format("YYYY-MM-DD") : "-",
      {
        x: currentX,
        y: currentY,
        size: 10,
        font: helveticaFont,
      },
    );

    // Adjust currentY based on the tallest text in this row
    const maxTextHeight = Math.max(20, commentHeight, signerHeight);
    if (maxTextHeight > 20) {
      currentY -= maxTextHeight - 20; // Add extra space if text wrapped
    }

    currentY -= 20;
  }

  // Total amount
  const totalAmount = expense.items.reduce((sum, item) => sum + item.amount, 0);
  page.drawText(`Total Amount: ${(totalAmount / 100).toFixed(2)} SEK`, {
    x: leftCol,
    y: currentY - 20,
    size: 14,
    font: helveticaBoldFont,
  });

  // Add attachments
  for (const item of expense.items) {
    if (!item.receiptUrl) continue;
    try {
      const fileBytes = await fetchFileAsBytes(item.receiptUrl);

      // If the URL suggests this is a PDF file
      if (isPdfUrl(item.receiptUrl)) {
        try {
          const existingPdf = await PDFDocument.load(fileBytes);
          const copiedPages = await pdfDoc.copyPages(
            existingPdf,
            existingPdf.getPageIndices(),
          );
          copiedPages.forEach((page) => pdfDoc.addPage(page));
        } catch (error) {
          // page.drawText("Error: Could not embed PDF receipt", {
          //   x: 50,
          //   y: height - 100,
          //   size: 12,
          //   font: helveticaFont,
          //   color: rgb(1, 0, 0),
          // });
          const errorMsg = error instanceof Error ? error.message : "-";
          throw new Error(`Error: Could not embed PDF receipt (${errorMsg})`);
        }
      }
      // If the URL suggests this is an image file
      else if (isImageUrl(item.receiptUrl)) {
        page = pdfDoc.addPage(A4_SIZE); // A4 size
        // Try both JPEG and PNG formats
        // try {
        const image = await pdfDoc
          .embedJpg(fileBytes)
          // .catch((e) => pdfDoc.embedPng(fileBytes))
          .catch(() =>
            sharp(fileBytes)
              // this is required to keep the image upright
              .rotate()
              .jpeg()
              .toBuffer()
              .then((buffer) => pdfDoc.embedJpg(new Uint8Array(buffer)))
              .catch(() => {
                throw new Error(
                  `Image was not correct format (${fileBytes.length} bytes, JPEG or PNG supported)`,
                );
              }),
          );

        // Calculate dimensions to fit the image on the page while maintaining aspect ratio
        const pageWidth = page.getWidth() - 100; // Leave 50px margin on each side
        const pageHeight = page.getHeight() - 150; // Leave margin for the header
        const imageRatio = image.width / image.height;
        let width = pageWidth;
        let height = pageWidth / imageRatio;

        if (height > pageHeight) {
          height = pageHeight;
          width = pageHeight * imageRatio;
        }

        // Center the image on the page
        const x = (page.getWidth() - width) / 2;
        const y = (page.getHeight() - height - 100) / 2; // Adjust for header

        page.drawImage(image, {
          x,
          y,
          width,
          height,
        });
      } else {
        throw new Error("Unsupported receipt file type");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      page.drawText(errorMessage, {
        x: 50,
        y: height - 100,
        size: 12,
        font: helveticaFont,
        color: rgb(1, 0, 0),
      });
      page.drawText(`Receipt link: ${item.receiptUrl}`, {
        x: 50,
        y: height - 120,
        size: 12,
        font: helveticaFont,
      });
    }
  }

  return pdfDoc.save();
}
