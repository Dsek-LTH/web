import type { Actions } from "./$types";
import { likesAction } from "./likes";

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
