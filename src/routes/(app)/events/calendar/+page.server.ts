import { BASIC_EVENT_FILTER } from "$lib/events/events";
import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";

export type ViewParam = "day" | "week" | "month";
export type RangeDateParam = string;
const include: Prisma.EventInclude = {
	author: true,
	comments: {
		include: {
			member: true,
		},
	},
	going: true,
	interested: true,
	tags: true,
};

export const load = async ({ locals, url }) => {
	const { prisma } = locals;
	const view: "day" | "week" | "month" = "month";
	const startDateParam = url.searchParams.get("startDate");
	const endDateParam = url.searchParams.get("endDate");
	const firstDate = startDateParam
		? dayjs(startDateParam)
		: dayjs().startOf(view).subtract(1, "week");
	const lastDate = endDateParam
		? dayjs(endDateParam)
		: dayjs().endOf(view).add(1, "week");

	const events = await prisma.event.findMany({
		where: {
			AND: [
				BASIC_EVENT_FILTER(),
				{
					// capture all events which overlap the range firstDate-lastDate
					OR: [
						{
							startDatetime: {
								gte: firstDate.toDate(),
								lte: lastDate.toDate(),
							},
						},
						{
							endDatetime: {
								gte: firstDate.toDate(),
								lte: lastDate.toDate(),
							},
						},
					],
				},
			],
		},
		include,
	});
	return {
		events,
	};
};
