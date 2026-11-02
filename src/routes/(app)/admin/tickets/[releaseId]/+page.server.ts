import { loadRoster } from "./loadRoster";

export const load = async (event) => loadRoster(event, event.params.releaseId);
