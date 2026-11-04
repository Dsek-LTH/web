/**
 * Development/sandbox only.
 * Writes sample meeting documents to the MinIO configured in .env.
 * Run with `pnpm seed:documents`, remove them with `pnpm seed:documents:clean`.
 */
import fs from "node:fs";
import { Client } from "minio";

function parseEnvFile(path: string): Record<string, string> {
  if (!fs.existsSync(path)) return {};

  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2]!;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]!] = value;
  }
  return values;
}

const fileEnv = {
  ...parseEnvFile(".env"),
  ...parseEnvFile(".env.local"),
};
const getEnv = (key: string) => process.env[key] ?? fileEnv[key] ?? "";

const year =
  process.env.DOCUMENTS_SEED_YEAR ?? new Date().getFullYear().toString();

const documentsBucket = getEnv("PUBLIC_BUCKETS_DOCUMENTS");
const filesBucket = getEnv("PUBLIC_BUCKETS_FILES");
const useSSL = getEnv("MINIO_USE_SSL") === "true";
const port = Number.parseInt(
  getEnv("MINIO_PORT") || (useSSL ? "443" : "80"),
  10,
);

const minio = new Client({
  endPoint: getEnv("MINIO_ENDPOINT"),
  port,
  useSSL,
  accessKey: getEnv("MINIO_ROOT_USER"),
  secretKey: getEnv("MINIO_ROOT_PASSWORD"),
});

const documentFiles = [
  // Board meetings
  "S11/Kallelse_S11.pdf",
  "S11/Föredragningslista_S11.pdf",
  "S11/Protokoll_S11.pdf",
  "S11/Fika på alla möten/Motion_Fika_S11.pdf",
  "S11/Fika på alla möten/Motion_Fika_bilaga_S11.pdf",
  "S11/Ny hoodie-färg/Proposition_Ny_hoodie_S11.pdf",
  "S11/Årlig ostfest/Proposition_Arlig_ostfest_S11.pdf",
  "S11/Bilaga_budget_S11.pdf",
  "S10/Kallelse_S10.pdf",
  "S10/Föredragningslista_S10.pdf",
  "S10/Protokoll_S10.pdf",

  // Guild meetings
  "HTM2/Kallelse_HTM2.pdf",
  "HTM2/Föredragningslista_HTM2.pdf",
  "HTM2/Protokoll_HTM2.pdf",
  "HTM2/Fika på alla möten/Motion_Fika_HTM2.pdf",
  "HTM2/Fika på alla möten/Motion_Fika_bilaga_A_HTM2.pdf",
  "HTM2/Fika på alla möten/Motion_Fika_bilaga_B_HTM2.pdf",
  "HTM2/Flytta valborg till onsdag/Proposition_Flytta_valborg_HTM2.pdf",
  "HTM2/Flytta valborg till onsdag/Proposition_Flytta_bilaga_HTM2.pdf",
  "HTM2/Gratis kaffe i sektionsrummet/Motion_Gratis_kaffe_HTM2.pdf",
  "HTM2/Gratis kaffe i sektionsrummet/Motion_Gratis_kaffe_bilaga_HTM2.pdf",
  "HTM2/Ny hoodie-färg/Proposition_Ny_hoodie_HTM2.pdf",
  "HTM2/Årlig ostfest/Proposition_Arlig_ostfest_HTM2.pdf",
  "HTM2/Bilaga_budget_HTM2.pdf",
  "HTM2/Bilaga_tidigare_HTM2.pdf",
  "HTM1/Kallelse_HTM1.pdf",
  "HTM1/Föredragningslista_HTM1.pdf",
  "HTM1/Protokoll_HTM1.pdf",
  "HTM1/Mer glitter i valstugan/Motion_Mer_glitter_HTM1.pdf",
  "VTM2/Kallelse_VTM2.pdf",
  "VTM2/Föredragningslista_VTM2.pdf",
  "VTM2/Protokoll_VTM2.pdf",

  // Old-style SRD meeting in the documents bucket
  "Möte 1/Kallelse_Mote_1.pdf",
  "Möte 1/Föredragningslista_Mote_1.pdf",
  "Möte 1/Protokoll_Mote_1.pdf",
];

const srdFiles = [
  "SRD10/Kallelse_SRD10.pdf",
  "SRD10/Föredragningslista_SRD10.pdf",
  "SRD10/Protokoll_SRD10.pdf",
  "SRD10/Fika på alla möten/Motion_Fika_SRD10.pdf",
  "SRD10/Ny hoodie-färg/Proposition_Ny_hoodie_SRD10.pdf",
  "SRD9/Kallelse_SRD9.pdf",
  "SRD9/Föredragningslista_SRD9.pdf",
  "SRD9/Protokoll_SRD9.pdf",

  // Old-style SRD file directly in the year folder
  "Möte 2.pdf",
];

const entries = [
  ...documentFiles.map((key) => ({
    bucket: documentsBucket,
    key: `public/${year}/${key}`,
  })),
  ...srdFiles.map((key) => ({
    bucket: filesBucket,
    key: `public/srd/${year}/${key}`,
  })),
];

// A minimal blank PDF so the links open something valid.
const pdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF
`);

async function main() {
  if (process.argv.includes("--clean")) {
    for (const { bucket, key } of entries) {
      await minio.removeObject(bucket, key);
    }
    console.log(`Removed ${entries.length} seeded document objects.`);
    return;
  }

  const buckets = [...new Set(entries.map((entry) => entry.bucket))];
  for (const bucket of buckets) {
    if (!(await minio.bucketExists(bucket))) {
      await minio.makeBucket(bucket);
      await minio.setBucketPolicy(
        bucket,
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      );
    }
  }

  for (const { bucket, key } of entries) {
    await minio.putObject(bucket, key, pdf, pdf.length, {
      "Content-Type": "application/pdf",
    });
  }

  console.log(
    `Seeded ${entries.length} document objects in ${buckets.join(", ")}.`,
  );
  console.log(
    `Open /documents?year=${year} and sign in with a user that can read documents.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
