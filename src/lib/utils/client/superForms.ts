import { toast } from "$lib/stores/toast";
import { superForm as SKSuperForms } from "sveltekit-superforms";

// If no strongly type message is needed, leave out the M type parameter
export function superForm<T extends Record<string, unknown>, M = Message>(
  ...params: Parameters<typeof SKSuperForms<T, M>>
) {
  return SKSuperForms<T, M>(params[0], {
    onError: (error) => {
      toast(error.result.error.message, "error");
    },
    ...params[1],
  });
}
