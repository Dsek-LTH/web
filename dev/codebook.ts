// Runs the codebook spell checker, downloading a pinned release the first time.
// Codebook is not published on npm, so this lets `pnpm spell` work without installing anything.
// Arguments are passed on to codebook, for example `vite-node dev/codebook.ts lint "**/*"`.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// To upgrade, change the version and replace the checksums with those of the new release assets.
const version = "0.3.43";
const checksums: Record<string, string> = {
  "aarch64-apple-darwin.tar.gz":
    "81e183cb670a18b3680329bf2a4afaca75a58a4102230b892bc256000b878e05",
  "aarch64-pc-windows-msvc.zip":
    "0b5df0fe7c5ef45c447c8a6bbfba122bbce180ae3ab0f6820230cd313948f399",
  "aarch64-unknown-linux-musl.tar.gz":
    "5ad6764a6c6df4c7a86813504f2d26119439633794fc47b7d89996cc2b5be9e7",
  "x86_64-apple-darwin.tar.gz":
    "19a67d0d64ed06cc1a5a71cbbb175736cdea4e9199239513f3f43a19a162ccf1",
  "x86_64-pc-windows-msvc.zip":
    "2ff7159ec9f2e379548cd86413e9000a967ac4fede87928b15b9a8d1f50ce80c",
  "x86_64-unknown-linux-musl.tar.gz":
    "ffdba23a01388b1eabf3c4aa5d051b357026406a02154bef310f5be26312e5af",
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

const directory = join("node_modules", ".cache", "codebook", version);
const executable = join(
  directory,
  process.platform === "win32" ? "codebook-lsp.exe" : "codebook-lsp",
);

if (!existsSync(executable)) {
  const url = `https://github.com/blopker/codebook/releases/download/v${version}/codebook-lsp-${asset}`;
  console.log(`Downloading codebook ${version}...`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download ${url}: ${response.status}`);
    process.exit(1);
  }
  const archive = Buffer.from(await response.arrayBuffer());

  const checksum = createHash("sha256").update(archive).digest("hex");
  if (checksum !== checksums[asset]) {
    console.error(
      `Checksum mismatch for ${url}, expected ${checksums[asset]} but got ${checksum}.`,
    );
    process.exit(1);
  }

  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  const archivePath = join(directory, `codebook-lsp-${asset}`);
  writeFileSync(archivePath, archive);
  // Tar handles both formats, including zip on Windows.
  const extraction = spawnSync("tar", ["-xf", archivePath, "-C", directory], {
    stdio: "inherit",
  });
  rmSync(archivePath);
  if (extraction.status !== 0 || !existsSync(executable)) {
    console.error("Failed to extract codebook.");
    process.exit(1);
  }
}

const result = spawnSync(executable, process.argv.slice(2), {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
