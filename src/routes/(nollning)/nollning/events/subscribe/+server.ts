import { REVEAL_LAUNCH_DATE } from "$lib/components/postReveal/types";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { generateICS } from "$lib/server/ics/calendar";
import dayjs from "dayjs";

export const GET = async ({ locals, setHeaders }) => {
	const { prisma } = locals;

	const revealTheme = REVEAL_LAUNCH_DATE <= new Date();

	const events = await prisma.event.findMany({
		where: {
			...BASIC_EVENT_FILTER(revealTheme),
			startDatetime: {
				gte: dayjs().subtract(1, "month").toDate(),
			},
			endDatetime: {
				lte: dayjs().add(3, "months").toDate(),
			},
		},
	});

	return generateICS(events, setHeaders);
};
