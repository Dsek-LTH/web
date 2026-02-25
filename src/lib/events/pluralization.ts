import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import { getFullName } from "$lib/utils/client/member";
import * as m from "$paraglide/messages";

export const formatGoingList = (
	going: Array<ExtendedPrismaModel<"Member">>,
): string => {
	switch (going.length) {
		case 0:
			return "";
		case 1:
			return m.events_interestedGoing_isGoing({ x: getFullName(going[0]!) });
		case 2:
			return m.events_interestedGoing_areGoing({
				x: m.events_interestedGoing_two({
					name1: getFullName(going[0]!),
					name2: getFullName(going[1]!),
				}),
			});
		default:
			return m.events_interestedGoing_areGoing({
				x: m.events_interestedGoing_threeOrMore({
					name1: getFullName(going[0]!),
					name2: getFullName(going[1]!),
					others: going.length - 2,
				}),
			});
	}
};

export const formatInterestedList = (
	interested: Array<ExtendedPrismaModel<"Member">>,
): string => {
	switch (interested.length) {
		case 0:
			return "";
		case 1:
			return m.events_interestedGoing_isInterested({
				x: getFullName(interested[0]!),
			});
		case 2:
			return m.events_interestedGoing_areInterested({
				x: m.events_interestedGoing_two({
					name1: getFullName(interested[0]!),
					name2: getFullName(interested[1]!),
				}),
			});
		default:
			return m.events_interestedGoing_areInterested({
				x: m.events_interestedGoing_threeOrMore({
					name1: getFullName(interested[0]!),
					name2: getFullName(interested[1]!),
					others: interested.length - 2,
				}),
			});
	}
};
