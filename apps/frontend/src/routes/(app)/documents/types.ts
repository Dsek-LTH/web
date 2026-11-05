import type { components } from "$lib/api/schema";

export type MeetingType = components["schemas"]["MeetingType"];

export const DocumentTypes = {
  boardMeeting: "board-meeting",
  guildMeeting: "guild-meeting",
  SRDMeeting: "SRD-meeting",
  other: "other",
} as const satisfies Record<string, MeetingType>;

const meetingTypes: readonly string[] = Object.values(DocumentTypes);

export const isMeetingType = (value: string | null): value is MeetingType =>
  value !== null && meetingTypes.includes(value);
