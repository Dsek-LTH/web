import express from "express";
import multer from "multer";
import { pdfToText } from "./poppler.js";

/**
 * This server converts PDF files to text using the Poppler library.
 * It uses an in-memory FIFO queue to process requests one at a time,
 * so the server doesn't get overwhelmed with multiple requests.
 * This server enables us to search in governing and meeting documents
 * on the website.
 */

const PORT = process.env.PORT || 8800;

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true); // Continue processing the request
    } else {
      cb(new Error("Only PDF files are allowed.")); // Reject other file types
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
});

// In-memory queue to store jobs
const queue = [];
let processing = false;

const enqueue = (job) =>
  new Promise((resolve, reject) => {
    queue.push({ job, resolve, reject });
    processQueue();
  });

const processQueue = async () => {
  if (processing || queue.length === 0) return;

  processing = true;
  const { job, resolve, reject } = queue.shift();

  try {
    const result = await job();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    processing = false;
    setImmediate(processQueue); // process the next one
  }
};

app.post("/", upload.single("file"), async (req, res) => {
  try {
    await enqueue(async () => {
      const { file } = req;
      if (!file) {
        res.status(400).json({ error: "No PDF file provided." });
        return;
      }

      const buffer = file.buffer;
      const fileHeader = buffer.toString("utf8", 0, 5);

      if (!fileHeader.startsWith("%PDF-")) {
        console.log(`Invalid PDF file:
Name: ${file.originalname}
Size: ${file.size} bytes
From: ${req.ip}
`);
        res.status(415).json({ error: "Invalid PDF file." });
        return;
      }

      console.log(`Converting PDF to text:
Name: ${file.originalname}
Size: ${file.size} bytes
From: ${req.ip}`);

      const txt = await pdfToText(file.buffer);
      console.log(`Successfully converted PDF to text: ${file.originalname}`);
      res.set("Content-Type", "text/plain");
      res.send(txt);
    });
  } catch (error) {
    res.status(500).json({ error: `Error converting PDF: ${error.message}` });
  }
});

// Health check endpoint
app.get("/health", async (_req, res) => {
  // Disable caching
  res
    .status(200)
    .set("Cache-Control", "no-store, max-age=0")
    .set("Pragma", "no-cache")
    .send("Server is running.");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
