import { v4 as uuid } from "uuid";
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
