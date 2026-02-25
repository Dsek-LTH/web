import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { generateICS } from "$lib/server/ics/calendar";
import dayjs from "dayjs";

export const GET = async ({ locals, setHeaders }) => {
	const { prisma } = locals;

	const events = await prisma.event.findMany({
		where: {
			...BASIC_EVENT_FILTER(false),
			startDatetime: {
				gte: dayjs().subtract(1, "month").toDate(),
			},
		},
	});

	return generateICS(events, setHeaders);
};
