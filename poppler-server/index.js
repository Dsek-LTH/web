import { Poppler } from "node-poppler";
import express from "express";
import multer from "multer";

const PORT = 8800;

const app = express();
const poppler = new Poppler();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true); // Continue processing the file
    } else {
      cb(new Error("Only PDF files are allowed.")); // Reject other file types
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
});

app.post("/", upload.single("file"), async (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: "No PDF file provided." });
  }

  // Further file validation (check if it's a valid PDF by examining the file header)
  const buffer = file.buffer;
  const fileHeader = buffer.toString("utf8", 0, 5); // Read the first 5 bytes

  if (!fileHeader.startsWith("%PDF-")) {
    console.log(
      `Invalid PDF file:
Name: ${file.originalname}
Size: ${file.size} bytes
From: ${req.ip}
`,
    );
    return res.status(400).json({ error: "Invalid PDF file." });
  }

  try {
    console.log(
      `Converting PDF to text:
Name: ${file.originalname}
Size: ${file.size} bytes
From: ${req.ip}`,
    );
    const txt = await poppler.pdfToText(file.buffer);
    console.log(`Successfully converted PDF to text: ${file.originalname}\n`);
    res.send(txt);
  } catch (error) {
    res.status(500).json({ error: `Error converting PDF: ${error.message}` });
  }
});

// Global error handler
app.use((err, _req, res) => {
  console.error(err); // Log the error for debugging
  res.status(500).json({ error: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
