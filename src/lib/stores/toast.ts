import { v4 as uuid } from "uuid";
import { writable } from "svelte/store";

export type ToastNotification = {
  message: string;
  type: "success" | "error" | "info" | "warning" | "primary" | "hidden";
  id: string;
};

export const toasts = writable<ToastNotification[]>([]);

export function toast(
  message: string,
  type: ToastNotification["type"] = "info",
  toastId?: string,
) {
  if (toastId) {
    toasts.update((state) => {
      if (state.some((t) => t.id === toastId)) return state;
      return [
        ...state,
        {
          message: message,
          type,
          id: toastId,
        },
      ];
    });
  } else {
    toasts.update((state) => [
      ...state,
      {
        message: message,
        type,
        id: uuid(),
      },
    ]);
  }
  setTimeout(removeToast, type === "error" ? 4000 : 2000);
}

function removeToast() {
  toasts.update((state) => {
    return state.slice(1);
  });
}

type RemoteFormResult = {
  message: string;
  type: MessageType;
};

export type RemoteForm = {
  enhance: (
    callback: (helpers: { submit: () => Promise<void> }) => Promise<void>,
  ) => Record<string, unknown>;
  result?: RemoteFormResult;
};

/**
 * Wraps a remote function's `.enhance()` to auto-toast the result.
 * Remote functions should return `{ message, type }` matching `MessageType`.
 */
export function enhanceWithToast(
  remoteForm: RemoteForm,
  callback?: (helpers: { submit: () => Promise<void> }) => Promise<void>,
) {
  return remoteForm.enhance(async (helpers) => {
    if (callback) {
      await callback(helpers);
    } else {
      await helpers.submit();
    }
    const result = remoteForm.result;
    if (result) toast(result.message, result.type);
  });
}
