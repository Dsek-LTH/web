import {
  authentication,
  createDirectus,
  login,
  refresh,
  rest,
  staticToken,
  updateMe,
  withToken,
} from "@directus/sdk";
import {
  readItems,
  readItem,
  updateItem,
  updateUser,
  createItem,
  deleteItem,
} from "@directus/sdk";
import { env } from "$env/dynamic/private";

async function getDirectusInstance(fetch: any) {
  const options = fetch ? { globals: { fetch } } : {};
  const temp = createDirectus(env["DIRECTUS_PUBLIC_API_URL"] ?? "", options)
    .with(authentication("json"))
    .with(rest());
  try {
    const user = await temp.login("admin@example.com", "password");

    //const thing = await directus.request(refresh("json", user.refresh_token!));
    //const client = createDirectus(
    //  env["DIRECTUS_PUBLIC_API_URL"] ?? "",
    //  options,
    //).with(rest());
    //const res = await directus.request(
    //  withToken(thing.access_token!, readItems("Landing")),
    //);
    temp.request(
      withToken(user.access_token!, updateMe({ token: env.DIRECTUS_TOKEN })),
    );
    //console.log(res);
  } catch (e) {
    console.log(e);
  }
  const directus = createDirectus(
    env["DIRECTUS_PUBLIC_API_URL"] ?? "",
    options,
  )
    .with(staticToken(env.DIRECTUS_TOKEN))
    .with(rest());

  return directus;
}

export default getDirectusInstance;
