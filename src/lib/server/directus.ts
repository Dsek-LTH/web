import { authentication, createDirectus, rest, staticToken } from "@directus/sdk";
import {
  readItems,
  readItem,
  updateItem,
  updateUser,
  createItem,
  deleteItem,
} from "@directus/sdk";
import { env } from "$env/dynamic/private";

function getDirectusInstance(fetch: any) {
  const options = fetch ? { globals: { fetch } } : {};
  const directus = createDirectus(env["DIRECTUS_PUBLIC_API_URL"] ?? "", options)
    .with(staticToken(env.DIRECTUS_TOKEN))
    .with(rest())
  return directus;
}

export default getDirectusInstance;
