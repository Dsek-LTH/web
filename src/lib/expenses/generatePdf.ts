import { getFullName } from "$lib/utils/client/member";
import dayjs from "dayjs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { ExpandedExpenseForPdf } from "./sendToBookkeeping";

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

  let page = pdfDoc.addPage([595.276, 841.89]); // A4 size
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
  for (const item of expense.items) {
    if (currentY < 50) {
      // Add new page if we're running out of space
      currentY = height - 50;
      page = pdfDoc.addPage([595.276, 841.89]);
    }

    currentX = leftCol;

    // Cost Center
    page.drawText(item.costCenter, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
    });
    currentX += colWidths[0]!;

    // Amount (convert from öre to SEK)
    page.drawText(`${(item.amount / 100).toFixed(2)} SEK`, {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
    });
    currentX += colWidths[1]!;

    // Comment
    page.drawText(item.comment || "-", {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
    });
    currentX += colWidths[2]!;

    // Signed By
    page.drawText(item.signedBy ? getFullName(item.signedBy) : "-", {
      x: currentX,
      y: currentY,
      size: 10,
      font: helveticaFont,
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

  return pdfDoc.save();
}
