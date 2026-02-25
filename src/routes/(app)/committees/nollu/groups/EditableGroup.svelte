<script lang="ts">
	import ScrollIndicatedBox from "$lib/components/layout/ScrollIndicatedBox.svelte";
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
	import type { PhadderGroupSchema } from "$lib/nollning/groups/types";
	import { getFullName } from "$lib/utils/client/member";
	import type { SuperValidated } from "sveltekit-superforms";
	import AddPersonInput from "./AddPersonInput.svelte";
	import DeleteGroupButton from "./DeleteGroupButton.svelte";
	import PhadderGroupForm from "./PhadderGroupForm.svelte";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let group: ExtendedPrismaModel<"PhadderGroup"> & {
		nollor: Array<ExtendedPrismaModel<"Member">>;
		phaddrar: Array<
			ExtendedPrismaModel<"Mandate"> & {
				member: ExtendedPrismaModel<"Member">;
			}
		>;
		form: SuperValidated<PhadderGroupSchema>;
	};
	let nollaBox: HTMLDivElement;
	let phadderBox: HTMLDivElement;

	let editing = false;
</script>

<div class="rounded-box bg-base-300 p-4">
	{#if editing}
		<PhadderGroupForm form={group.form} onResult={() => (editing = false)}>
			<button
				slot="start"
				class="btn self-end"
				on:click={() => (editing = false)}
			>
				Avbryt <span class="i-mdi-close"></span>
			</button>
		</PhadderGroupForm>
	{:else}
		{#if group.imageUrl}
			<img
				src={group.imageUrl}
				alt="Group logo"
				class="rounded-box max-h-32 w-full max-w-32"
			/>
		{/if}
		<div class="flex justify-between">
			<h5>{group.name}</h5>
			<div class="flex gap-2">
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button
					type="button"
					class="btn btn-square btn-secondary btn-sm"
					on:click={() => (editing = true)}
				>
					<span class="i-mdi-edit"></span>
				</button>
				<DeleteGroupButton groupId={group.id} />
			</div>
		</div>
		{#if group.description}
			<MarkdownBody body={group.description} />
		{/if}
		<div class="mt-4">
			<h5 class="font-medium">Nollor</h5>
			<ScrollIndicatedBox element={nollaBox}>
				<div class="max-h-80 overflow-y-auto" bind:this={nollaBox}>
					<ul class="menu menu-vertical overflow-visible p-0">
						{#each group.nollor as member (member.id)}
							<li>
								<a href="/members/{member.studentId}">
									<div class="flex flex-row items-center gap-2">
										<MemberAvatar {member} />
										<div>
											<h3 class="font-medium">
												{getFullName(member)}
											</h3>
										</div>
									</div>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</ScrollIndicatedBox>
			<AddPersonInput groupId={group.id} />
		</div>

		<div class="mt-4">
			<h5 class="font-medium">Phaddrar</h5>
			<ScrollIndicatedBox element={phadderBox}>
				<div class="max-h-80 overflow-y-auto" bind:this={phadderBox}>
					<ul class="menu menu-vertical p-0">
						{#each group.phaddrar as phadder (phadder.id)}
							{@const member = phadder.member}
							<li>
								<a href="/members/{member.studentId}">
									<div class="flex flex-row items-center gap-2">
										<MemberAvatar {member} />
										<div>
											<h3 class="font-medium">
												{getFullName(member)}
											</h3>
										</div>
									</div>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</ScrollIndicatedBox>
			<AddPersonInput groupId={group.id} phadder year={group.year} />
		</div>
	{/if}
</div>
