import apiNames from "$lib/utils/apiNames";
import { authorise } from "$lib/utils/authorization";
import eventPageLoad from "../EventPageLoad";

const loadFunc = eventPageLoad(true);
export const load = (event) => {
  authorise(apiNames.EVENT.UPDATE, event.locals.user);
  return loadFunc(event);
};
