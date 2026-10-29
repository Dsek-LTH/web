import { toast } from "$lib/stores/toast";
import type { ActionResult } from "@sveltejs/kit";
// eslint-disable-next-line no-restricted-imports -- this is the only place it is actually supposed to be used
import { superForm as SKSuperForms } from "sveltekit-superforms/client";

/** Toast the message returned by `message(form, ...)` after a successful form action. */
export function toastFormMessage(result: ActionResult) {
  if (result.type !== "success") return;
  const message = (result.data as { form?: { message?: Message } } | undefined)
    ?.form?.message;
  if (!message || message.type === "hidden") return;
  toast(message.message, message.type, message.id);
}

// If no strongly type message is needed, leave out the M type parameter
export function superForm<T extends Record<string, unknown>, M = Message>(
  ...params: Parameters<typeof SKSuperForms<T, M>>
): ReturnType<typeof SKSuperForms<T, M>> {
  return SKSuperForms<T, M>(params[0], {
    onError: (response) => {
      if (response.result.status === 401) {
        const hasMessage = response.result.error.message !== "Error: 401";
        toast(
          hasMessage
            ? response.result.error.message
            : "Du måste vara inloggad för att göra detta",
          "error",
        );
      } else if (response.result.status === 403) {
        toast("Du har inte acccess för att göra detta", "error");
      } else {
        toast(response.result.error.message, "error");
      }
    },
    ...params[1],
  });
}
