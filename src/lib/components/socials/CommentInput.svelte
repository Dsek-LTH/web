<script lang="ts">
	import MemberSearch from "$lib/components/MemberSearch.svelte";
	import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
	import { getFullName } from "$lib/utils/client/member";
	import type { CommentSchema } from "$lib/zod/comments";
	import type { SuperValidated } from "sveltekit-superforms";
	import { superForm } from "$lib/utils/client/superForms";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let author: ExtendedPrismaModel<"Member">;
	export let commentForm: SuperValidated<CommentSchema>;
	const { form, errors, constraints, enhance } = superForm(commentForm, {
		resetForm: true,
	});

	export const onReply = (
		comment: (
			| ExtendedPrismaModel<"ArticleComment">
			| ExtendedPrismaModel<"EventComment">
		) & { member: ExtendedPrismaModel<"Member"> },
	) => {
		const tagString = `[@${getFullName(comment.member)}](/members/${
			comment.member.studentId
		}) `;
		form.update((f) => {
			if (f.content.trim().startsWith("[@") || f.content.trim().length === 0) {
				f.content = tagString;
			} else {
				f.content = `${tagString}${f.content}`;
			}
			return f;
		});
	};

	let handleSearch: (searchValue: string) => void;
	let indexOfTagStart = -1;
	let inputEl: HTMLInputElement;
</script>

<div class="flex items-end gap-4">
	<MemberAvatar member={author} class="w-12 rounded-lg" />
	<div class="flex flex-1 flex-col flex-nowrap">
		<label class="label w-auto self-start" for="comment">
			<span class="label-text">Kommentera</span>
		</label>
		<form
			class="join join-horizontal w-full"
			method="POST"
			action="?/comment"
			use:enhance
		>
			<MemberSearch
				bind:handleSearch
				class="dropdown-top flex-1"
				onSelect={(selectedMember) => {
					form.update((f) => {
						f.content = `${f.content.substring(
							0,
							indexOfTagStart,
						)}[@${getFullName(selectedMember)}](/members/${
							selectedMember.studentId
						}) `;
						return f;
					});
					inputEl.focus();
				}}
			>
				<input
					bind:this={inputEl}
					autocomplete="off"
					id="comment"
					name="content"
					type="text"
					class="input join-item input-bordered w-full"
					placeholder="Kommentera något kul..."
					bind:value={$form.content}
					{...$constraints}
					on:keypress={(e) => {
						// on @ -> start tagging
						if (e.key === "@") {
							indexOfTagStart = e.currentTarget.selectionStart ?? -1;
							// on escape -> stop tagging
						} else if (e.key === "Escape") {
							indexOfTagStart = -1;
						}
					}}
					on:input={(e) => {
						if (indexOfTagStart === -1) return;
						const currentComment = e.currentTarget.value;
						if (currentComment.lastIndexOf("@") !== indexOfTagStart) {
							indexOfTagStart = -1;
							handleSearch("");
							return;
						}
						const searchValue = currentComment.substring(indexOfTagStart + 1);
						handleSearch(searchValue);
					}}
				/>
			</MemberSearch>
			<button type="submit" class="btn btn-primary join-item">Skicka</button>
		</form>
	</div>
</div>
{#if $errors.content}
	<p class="text-error">{$errors.content}</p>
{/if}
