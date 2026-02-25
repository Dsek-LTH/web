import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import {
	canAccessDeletedSongs,
	fixSongText,
	getExistingCategories,
	getExistingMelodies,
} from "../helpers";
import { updateSongSchema } from "../schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
	const { prisma, user } = locals;
	const accessPolicies = user?.policies ?? [];
	const song = await prisma.song.findUnique({
		where: {
			slug: params.slug,
			deletedAt: canAccessDeletedSongs(accessPolicies) ? {} : null,
		},
	});

	if (song == null) {
		throw error(404, {
			message: m.songbook_errors_songNotFound(),
		});
	}

	const [existingCategories, existingMelodies] = await Promise.all([
		getExistingCategories(
			prisma,
			accessPolicies,
			canAccessDeletedSongs(accessPolicies),
		),
		getExistingMelodies(
			prisma,
			accessPolicies,
			canAccessDeletedSongs(accessPolicies),
		),
	]);

	const form = await superValidate(song, zod(updateSongSchema));

	return {
		song: {
			...song,
			title: fixSongText(song.title),
			lyrics: fixSongText(song.lyrics),
		},
		updateForm: form,
		existingCategories,
		existingMelodies,
	};
};
