import { z } from "zod";
export const TODAY_AT_17_15 = new Date();
TODAY_AT_17_15.setHours(17, 15, 0, 0);
export const TODAY_AT_23_00 = new Date();
TODAY_AT_23_00.setHours(23, 0, 0, 0);
export const NEXT_TUESDAY_AT_12_15 = new Date();
NEXT_TUESDAY_AT_12_15.setDate(
  NEXT_TUESDAY_AT_12_15.getDate() + ((2 + 7 - NEXT_TUESDAY_AT_12_15.getDay()) % 7)
);
NEXT_TUESDAY_AT_12_15.setHours(12, 15, 0, 0);
export const NEXT_TUESDAY_AT_13_00 = new Date();
NEXT_TUESDAY_AT_13_00.setDate(
  NEXT_TUESDAY_AT_13_00.getDate() + ((2 + 7 - NEXT_TUESDAY_AT_13_00.getDay()) % 7)
);
NEXT_TUESDAY_AT_13_00.setHours(13, 0, 0, 0);

export enum MEETING_TYPE {
  GuildMeeting = "guild-meeting",
  BoardMeeting = "board-meeting",
  Other = "other",
}

export const meetingSchema = z
  .object({
    title: z.string().default(""),
    description: z.string().nullable().default(null),
    type: z
      .enum([MEETING_TYPE.GuildMeeting, MEETING_TYPE.BoardMeeting, MEETING_TYPE.Other])
      .default(MEETING_TYPE.GuildMeeting),
    start: z.date().default(() => TODAY_AT_17_15),
    end: z.date().default(() => TODAY_AT_23_00),
  })
  .refine((data) => data.end >= data.start, {
    message: "End date must be after start date",
    path: ["end"],
  });
export type MeetingSchema = typeof meetingSchema;
