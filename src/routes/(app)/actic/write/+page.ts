import { redirect } from "@sveltejs/kit";

/** Bare `/actic/write` has no family; send it to the default family. */
export function load() {
  redirect(307, "/actic/write/deliberation");
}
