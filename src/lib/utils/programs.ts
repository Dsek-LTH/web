import * as messages from "$paraglide/messages";

export const programs = [
  { id: "D", name: messages.programs_computerScience },
  { id: "C", name: messages.programs_infoCom },
  { id: "VR/AR", name: messages.programs_vrAr },
  { id: "E", name: messages.programs_electricalEngineering },
  { id: "BME", name: messages.programs_BME },
  { id: "Dokt", name: messages.programs_phD },
  { id: "?", name: messages.programs_other },
] as const;
