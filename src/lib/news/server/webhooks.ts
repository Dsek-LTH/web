import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

const limitDescription = (text: string): string => {
	let description = text.replace(/\n/g, " ").slice(0, 256 - 3);
	description += description.length == 256 - 3 ? "..." : "";

	const rows = description.split("\n");
	if (rows.length > 4) {
		description = rows.slice(0, 4).join("\n") + "...";
	}
	return description;
};

export const sendNewArticleWebhook = async (
	article: ExtendedPrismaModel<"Article"> & {
		tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>;
		author: ExtendedPrismaModel<"Author">;
	},
	notificationText: string | null | undefined,
) => {
	const member = await authorizedPrismaClient.member.findUnique({
		where: {
			id: article.author.memberId,
		},
	});
	const tags = await authorizedPrismaClient.tag.findMany({
		where: {
			id: {
				in: article.tags.map((tag) => tag.id),
			},
		},
	});

	let title: string | undefined = undefined;
	if (article.author.mandateId !== null) {
		const mandate = await authorizedPrismaClient.mandate.findUnique({
			where: {
				id: article.author.mandateId ?? undefined,
			},
		});
		if (mandate) {
			const position = await authorizedPrismaClient.position.findUnique({
				where: {
					id: mandate?.positionId,
				},
			});
			title = position?.nameSv;
		}
	}

	// Create an object mapping key -> value of the following
	// keys. Removes potential duplicates (if possible)
	const settings = Object.fromEntries(
		(
			await authorizedPrismaClient.adminSetting.findMany({
				where: {
					key: {
						in: ["discord_webhook_se", "webhook_tags_se"],
					},
				},
				select: {
					key: true,
					value: true,
				},
			})
		).map((row) => [row.key, row.value]),
	);

	if (!settings["discord_webhook_se"]) return; // No webhook to call

	// If webhook_tags is not set, we allow through all news
	if (settings["webhook_tags_se"]) {
		const webhookTags = new Set(settings["webhook_tags_se"].split(","));

		// Otherwise, webhook_tags acts as a filter. Only allow articles that
		// have any of the tags. We assume that the article has very few tags
		if (!article.tags.some((tag) => webhookTags.has(tag.id))) return;
	}

	// In most cases, an event will only have one tag. For the others,
	// we just pick an arbitrary tag
	let color = undefined;
	let footer = undefined;
	if (article.tags.length > 0) {
		const tag = tags.find((tag) => tag.id === article.tags[0]?.id);
		if (tag !== undefined) {
			footer = tag.nameSv;
		}

		if (typeof tag?.color === "string") {
			// Convert HEX-string in the form #FFFFFF to an integer for Discord API
			color = parseInt(tag.color.slice(1), 16);
		}
	}

	// Limit news description to first few characters as a preview, although
	// you could technically fit the entire article within the 4096 character limit
	const description = limitDescription(article.bodySv);

	const body = {
		content: notificationText,
		embeds: [
			{
				title: article.headerSv,
				author: {
					name: `${member?.firstName} ${member?.lastName} ${title ? "| " + title : ""}`,
					icon_url: member?.picturePath,
				},
				// Default to development URL
				url: `${process.env["ORIGIN"] ?? "http://localhost:5173"}/news/${article.slug}`,
				description: description,
				color: color,
				footer: {
					text: footer,
				},
				timestamp: article.createdAt,
			},
		],
	};

	const res = await fetch(settings["discord_webhook_se"], {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (res.status != 204) {
		console.log(`notifications: failed Discord webhook (${res.status})`);
	}
};
