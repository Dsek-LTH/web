import {
	DEFAULT_SUBSCRIPTION_SETTINGS,
	NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS,
} from "$lib/utils/notifications/types";
import { error } from "@sveltejs/kit";
import { getDerivedRoles } from "./authorization";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

export const getCustomAuthorOptions = async (
	prisma: ExtendedPrisma,
	memberId: string,
) => {
	const activePositionIds = await prisma.position
		.findMany({
			select: {
				id: true,
			},
			where: {
				mandates: {
					some: {
						startDate: {
							lte: new Date(),
						},
						endDate: {
							gte: new Date(),
						},
						memberId,
					},
				},
			},
		})
		.then((positions) => positions.map((pos) => pos.id));
	return await prisma.customAuthor.findMany({
		where: {
			roles: {
				some: {
					role: {
						in: getDerivedRoles(activePositionIds, !!memberId),
					},
				},
			},
		},
	});
};

export type MemberDoorPolicies = Array<{
	name: string;
	verboseName: string | undefined;
	roles: string[];
	startDate: Date | null;
	endDate: Date | null;
}>;

export const getCurrentDoorPoliciesForMember = async (
	prisma: ExtendedPrisma,
	studentId: string,
) => {
	const memberPositionIds = await prisma.position
		.findMany({
			select: {
				id: true,
				name: true,
				boardMember: true,
			},
			where: {
				mandates: {
					some: {
						member: {
							studentId,
						},
						startDate: {
							lte: new Date(),
						},
						endDate: {
							gte: new Date(),
						},
					},
				},
			},
		})
		.catch(() => {
			throw error(500, "Could not fetch member positions");
		});
	const userDoorPolicies = await prisma.doorAccessPolicy
		.findMany({
			where: {
				AND: [
					{ isBan: false },
					{
						// is active, or indefinite
						OR: [
							{ startDatetime: null },
							{ startDatetime: { lte: new Date() } },
						],
					},
					{
						// is active, or indefinite
						OR: [{ endDatetime: null }, { endDatetime: { gte: new Date() } }],
					},
					{
						OR: [
							{ studentId /* is for this user */ },
							{
								// or is for a role this user has
								role: {
									in: getDerivedRoles(
										memberPositionIds.map((pos) => pos.id),
										true,
									).concat(
										memberPositionIds.some((pos) => pos.boardMember)
											? ["dsek.styr"]
											: [],
									),
								},
							},
						],
					},
				],
			},
		})
		.catch(() => {
			throw error(500, "Could not fetch door access");
		});

	const doors = await prisma.door.findMany();

	const policiesByDoor: MemberDoorPolicies = userDoorPolicies.reduce(
		(acc, policy) => {
			const role = policy.role ?? "Du";
			const duplicate = acc.find(
				(p) =>
					p.name === policy.doorName &&
					p.startDate === policy.startDatetime &&
					p.endDate === policy.endDatetime,
			);
			if (duplicate) {
				duplicate.roles.push(role);
				return acc;
			}
			acc.push({
				name: policy.doorName,
				verboseName: doors.find((door) => door.name == policy.doorName)
					?.verboseName,
				roles: [role],
				startDate: policy.startDatetime,
				endDate: policy.endDatetime,
			});
			return acc;
		},
		[] as MemberDoorPolicies,
	);
	const memberDoorPolicies: MemberDoorPolicies = policiesByDoor.map(
		(policy) => {
			const positionsMappedToThisDoor = memberPositionIds
				.filter((pos) =>
					policy.roles.some(
						(role) =>
							pos.id.startsWith(role) ||
							(pos.boardMember && role === "dsek.styr"),
					),
				)
				.map((pos) => pos.name);
			positionsMappedToThisDoor.sort();
			return {
				...policy,
				roles:
					positionsMappedToThisDoor.length > 0
						? positionsMappedToThisDoor
						: ["Du"],
			};
		},
	);
	memberDoorPolicies.sort((a, b) => a.name.localeCompare(b.name));

	return memberDoorPolicies;
};

/**
 * Create a member with default settings for notifications and tag subscriptions
 */
export const createMember = async (
	prisma: ExtendedPrisma,
	data: {
		studentId: string;
		firstName: string;
		lastName: string;
		email: string | null | undefined;
	},
) => {
	if (await isNollningPeriod()) {
		const defaultTag = await prisma.tag.findFirst({
			where: {
				nameSv: {
					startsWith: NOLLNING_TAG_PREFIX,
				},
			},
		});
		return await prisma.member.create({
			data: {
				...data,
				classYear: new Date().getFullYear(),
				subscriptionSettings: {
					createMany: {
						data: NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS,
					},
				},
				subscribedTags: {
					connect: defaultTag ? { id: defaultTag.id } : undefined,
				},
			},
		});
	}
	const defaultTags = await prisma.tag.findMany({
		where: {
			isDefault: true,
		},
	});
	return await prisma.member.create({
		data: {
			...data,
			classYear: new Date().getFullYear(),
			subscriptionSettings: {
				createMany: {
					data: DEFAULT_SUBSCRIPTION_SETTINGS,
				},
			},
			subscribedTags: {
				connect: defaultTags.map((tag) => ({ id: tag.id })),
			},
		},
	});
};
