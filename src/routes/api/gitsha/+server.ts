import { readFileSync } from "fs";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
  let sha = readFileSync(".git/HEAD").toString().trim();
  if (sha.indexOf(":") !== -1) {
    sha = readFileSync(`.git/${sha.substring(5)}`)
      .toString()
      .trim();
  }
  const result = {
    fullSHA: sha,
    shortSHA: sha.substring(0, 7),
    commitLink: `https://github.com/Dsek-LTH/web/commit/${sha}`,
    treeLink: `https://github.com/Dsek-LTH/web/tree/${sha}`,
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
};
