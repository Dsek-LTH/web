// Runs the codebook spell checker, downloading a pinned release the first time.
// Codebook is not published on npm, so this lets `pnpm spell` work without installing anything.
// Arguments are passed on to codebook, for example `vite-node dev/codebook.ts lint "**/*"`.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

// To upgrade, change the version and replace the checksums with those of the new release.
// The archive checksum verifies the download and the executable checksum verifies the cached binary.
const version = "0.3.43";
const checksums: Record<string, { archive: string; executable: string }> = {
  "aarch64-apple-darwin.tar.gz": {
    archive: "81e183cb670a18b3680329bf2a4afaca75a58a4102230b892bc256000b878e05",
    executable:
      "2e58befc8bf8f3d43884536e661a5d7bf5f1ce4c294e5f0fa50ebb86b14aabd8",
  },
  "aarch64-pc-windows-msvc.zip": {
    archive: "0b5df0fe7c5ef45c447c8a6bbfba122bbce180ae3ab0f6820230cd313948f399",
    executable:
      "2943751aa2e64fb537952bcd7faecb76d877db78e327ca2d9508df6b019324a4",
  },
  "aarch64-unknown-linux-musl.tar.gz": {
    archive: "5ad6764a6c6df4c7a86813504f2d26119439633794fc47b7d89996cc2b5be9e7",
    executable:
      "1c6498bb7c449843437dcf8373ded8d0e38001c293ba6c530dc4b6ee86651dc4",
  },
  "x86_64-apple-darwin.tar.gz": {
    archive: "19a67d0d64ed06cc1a5a71cbbb175736cdea4e9199239513f3f43a19a162ccf1",
    executable:
      "39cb0642dde258cbffb53a0693b48d10e39c40b141b91ac43d5e31f861899d8e",
  },
  "x86_64-pc-windows-msvc.zip": {
    archive: "2ff7159ec9f2e379548cd86413e9000a967ac4fede87928b15b9a8d1f50ce80c",
    executable:
      "cd3cd49af93aeebddfe5b111c43b30be67129cc3b8ed1cea71dd3eb6c9ae0d04",
  },
  "x86_64-unknown-linux-musl.tar.gz": {
    archive: "ffdba23a01388b1eabf3c4aa5d051b357026406a02154bef310f5be26312e5af",
    executable:
      "14c133ef37d1f043f975be337b71db488b98afe54520aaf99f22c22215ec0bf6",
  },
};

const architectures: Record<string, string> = {
  arm64: "aarch64",
  x64: "x86_64",
};
const platforms: Record<string, string> = {
  darwin: "apple-darwin.tar.gz",
  linux: "unknown-linux-musl.tar.gz",
  win32: "pc-windows-msvc.zip",
};

const architecture = architectures[process.arch];
const platform = platforms[process.platform];
if (!architecture || !platform) {
  console.error(
    `Codebook has no prebuilt binary for ${process.platform}/${process.arch}.`,
  );
  process.exit(1);
}
const asset = `${architecture}-${platform}`;
const expected = checksums[asset]!;

const sha256 = (data: Buffer) =>
  createHash("sha256").update(data).digest("hex");
const isValidExecutable = (path: string) =>
  existsSync(path) && sha256(readFileSync(path)) === expected.executable;

const directory = join("node_modules", ".cache", "codebook", version);
const executableName =
  process.platform === "win32" ? "codebook-lsp.exe" : "codebook-lsp";
const executable = join(directory, executableName);

// This also replaces a cached binary that is incomplete or corrupted.
if (!isValidExecutable(executable)) {
  const url = `https://github.com/blopker/codebook/releases/download/v${version}/codebook-lsp-${asset}`;
  console.log(`Downloading codebook ${version}...`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download ${url}: ${response.status}`);
    process.exit(1);
  }
  const archive = Buffer.from(await response.arrayBuffer());

  const checksum = sha256(archive);
  if (checksum !== expected.archive) {
    console.error(
      `Checksum mismatch for ${url}, expected ${expected.archive} but got ${checksum}.`,
    );
    process.exit(1);
  }

  // Extract next to the cache and move it into place when complete,
  // so an interrupted run never leaves a partial binary behind.
  const temporaryDirectory = `${directory}.partial`;
  rmSync(temporaryDirectory, { recursive: true, force: true });
  mkdirSync(temporaryDirectory, { recursive: true });
  const archivePath = join(temporaryDirectory, `codebook-lsp-${asset}`);
  writeFileSync(archivePath, archive);
  // Tar handles both formats, including zip on Windows.
  const extraction = spawnSync(
    "tar",
    ["-xf", archivePath, "-C", temporaryDirectory],
    { stdio: "inherit" },
  );
  rmSync(archivePath);
  if (
    extraction.status !== 0 ||
    !isValidExecutable(join(temporaryDirectory, executableName))
  ) {
    console.error("Failed to extract codebook.");
    process.exit(1);
  }
  rmSync(directory, { recursive: true, force: true });
  renameSync(temporaryDirectory, directory);
}

const result = spawnSync(executable, process.argv.slice(2), {
  stdio: "inherit",
});
if (result.error) {
  console.error(`Failed to run codebook: ${result.error.message}`);
}
process.exit(result.status ?? 1);
