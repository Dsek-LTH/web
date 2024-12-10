import { toast } from "$lib/stores/toast";
// eslint-disable-next-line no-restricted-imports -- this is the only place it is actually supposed to be used
import { superForm as SKSuperForms } from "sveltekit-superforms/client";

// If no strongly type message is needed, leave out the M type parameter
export function superForm<T extends Record<string, unknown>, M = Message>(
  ...params: Parameters<typeof SKSuperForms<T, M>>
): ReturnType<typeof SKSuperForms<T, M>> {
  return SKSuperForms<T, M>(params[0], {
    onError: (response) => {
      if (response.result.status === 401) {
        toast("Du måste vara inloggad för att göra detta", "error");
      } else if (response.result.status === 403) {
        toast("Du har inte acccess för att göra detta", "error");
      } else {
        toast(response.result.error.message, "error");
      }
    },
    ...params[1],
  });
}
