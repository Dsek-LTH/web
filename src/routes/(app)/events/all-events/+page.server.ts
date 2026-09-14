import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import eventPageLoad from "../EventPageLoad";

const loadFunc = eventPageLoad(true);
export const load = (event) => {
  authorize(apiNames.EVENT.UPDATE, event.locals.user);
  return loadFunc(event);
};
