import generateUUID from "$lib/utils/generateUUID";
import { writable } from "svelte/store";

export type ToastNotification = {
  message: string;
  type: "success" | "error" | "info" | "warning" | "primary";
  id: string;
};

export const toasts = writable<ToastNotification[]>([]);

export function toast(
  message: string,
  type: ToastNotification["type"] = "info",
) {
  toasts.update((state) => [
    ...state,
    {
      message: message,
      type,
      id: generateUUID(),
    },
  ]);
  setTimeout(removeToast, 2000);
}

function removeToast() {
  toasts.update((state) => {
    return state.slice(1);
  });
}
