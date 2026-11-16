import { env } from "$env/dynamic/private";
import {
  buildCatalog,
  findDocument,
  type GoverningDocument,
  type GoverningGroup,
} from "$lib/actic/governing";

const REPO = "Dsek-LTH/styrdokument";
const GRAFIK_REPO = "Dsek-LTH/grafik";
const CACHE_TTL_MS = 10 * 60 * 1000;

export type GoverningAsset = { path: string; base64: string };

export type GoverningSource = {
  ref: string;
  commit: string;
  source: string;
  assets: GoverningAsset[];
  assetWarning: boolean;
};

export type ResolveResult =
  | { status: "ok"; document: GoverningDocument }
  | { status: "unknown" }
  | { status: "unavailable" };

function repoRef(): string {
  return env["STYRDOKUMENT_REF"] || "main";
}

function grafikRef(): string {
  return env["GRAFIK_REF"] || "main";
}

function headers(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsek-web-actic",
    ...(env["GITHUB_TOKEN"]
      ? { Authorization: `Bearer ${env["GITHUB_TOKEN"]}` }
      : {}),
  };
}

const cache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return Promise.resolve(hit.value as T);

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      inFlight.delete(key);
      return value;
    })
    .catch((error) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, promise);
  return promise;
}

export function resetGoverningCacheForTests(): void {
  cache.clear();
  inFlight.clear();
}

export function getGoverningCatalog(): Promise<GoverningGroup[]> {
  return cached("catalog", async () => {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/git/trees/${repoRef()}?recursive=1`,
      { headers: headers() },
    );
    if (!response.ok) {
      throw new Error(`GitHub catalog request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      tree?: Array<{ path?: string; type?: string }>;
    };
    const paths = (data.tree ?? [])
      .filter(
        (entry) =>
          entry.type === "blob" &&
          typeof entry.path === "string" &&
          entry.path.endsWith(".typ"),
      )
      .map((entry) => entry.path as string);

    // Titles and groups are read from each document's head (the `#show:`
    // wrapper and its `subject`), so new documents need no list updates
    // here. Failed head fetches fall back to path-derived descriptions.
    const results = await Promise.allSettled(
      paths.map((path) => fetchHead(path)),
    );
    return buildCatalog(
      paths.map((path, index) => {
        const result = results[index];
        return {
          path,
          head: result?.status === "fulfilled" ? result.value : "",
        };
      }),
    );
  });
}

/** The first few KiB are enough for the `#show:` wrapper and its subject. */
async function fetchHead(path: string): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${REPO}/${repoRef()}/${path}`,
    { headers: { ...headers(), Range: "bytes=0-4095" } },
  );
  if (!response.ok) {
    throw new Error(`GitHub head request failed: ${response.status}`);
  }
  return response.text();
}

export async function resolveGoverningDocument(
  slug: string,
): Promise<ResolveResult> {
  if (!/^[a-z0-9-]+$/.test(slug)) return { status: "unknown" };

  try {
    const catalog = await getGoverningCatalog();
    const document = findDocument(catalog, slug);
    if (!document) return { status: "unknown" };
    return { status: "ok", document };
  } catch {
    return { status: "unavailable" };
  }
}

async function fetchAsset(assetPath: string): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${GRAFIK_REPO}/${grafikRef()}/${assetPath.slice("/grafik/".length)}`,
    { headers: headers() },
  );
  if (!response.ok) {
    throw new Error(`Grafik asset request failed: ${response.status}`);
  }
  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

export function loadGoverningSource(
  document: GoverningDocument,
): Promise<GoverningSource> {
  return cached(`source:${document.path}`, async () => {
    const sourceResponse = await fetch(
      `https://raw.githubusercontent.com/${REPO}/${repoRef()}/${document.path}`,
      { headers: headers() },
    );
    if (!sourceResponse.ok) {
      throw new Error(`GitHub source request failed: ${sourceResponse.status}`);
    }
    const source = await sourceResponse.text();

    let commit = repoRef();
    try {
      const commitResponse = await fetch(
        `https://api.github.com/repos/${REPO}/commits/${repoRef()}`,
        { headers: headers() },
      );
      if (commitResponse.ok) {
        const data = (await commitResponse.json()) as { sha?: string };
        if (data.sha) commit = data.sha;
      }
    } catch {
      // Fall back to the configured ref.
    }

    const assetPaths = [
      ...source.matchAll(/(?:path|image)\(\s*"(\/grafik\/[^"]+)"/g),
    ]
      .map((match) => match[1]!)
      .filter((path) => path.startsWith("/grafik/") && !path.includes(".."));

    const results = await Promise.allSettled(
      assetPaths.map((assetPath) => fetchAsset(assetPath)),
    );

    const assets: GoverningAsset[] = [];
    let assetWarning = false;
    for (let index = 0; index < assetPaths.length; index++) {
      const result = results[index];
      if (result?.status === "fulfilled") {
        assets.push({ path: assetPaths[index]!, base64: result.value });
      } else {
        assetWarning = true;
      }
    }

    return { ref: repoRef(), commit, source, assets, assetWarning };
  });
}
