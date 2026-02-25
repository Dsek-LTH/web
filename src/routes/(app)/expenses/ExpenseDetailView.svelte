<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
	import apiNames from "$lib/utils/apiNames";
	import { isAuthorized } from "$lib/utils/authorization";
	import { getFullName } from "$lib/utils/client/member";
	import dayjs from "dayjs";
	import type { SuperForm, SuperValidated } from "sveltekit-superforms";
	import type { ExpandedExpense } from "./+page.server";
	import ExpenseReceipt from "./[id]/ExpenseReceipt.svelte";
	import type { UpdateExpenseSchema, UpdateItemSchema } from "./types";

	$: user = $page.data.user;
	export let expense: ExpandedExpense;
	$: canSign =
		expense.items.some((item) => !item.signedAt) &&
		(expense.items.some((item) => item.signerMemberId === user?.memberId) ||
			isAuthorized(apiNames.EXPENSES.CERTIFICATION, user));

	export let superform: SuperForm<UpdateExpenseSchema> | undefined = undefined;
	export let itemForm: SuperValidated<UpdateItemSchema> | undefined = undefined;
	$: updateEnhance = superform?.enhance;
</script>

<!-- Header with meta info (guild card, who sent it, and when) -->
<div class="flex items-center">
	<section class="border-base-content inline-block rounded-md border px-4 py-2">
		<div class="flex justify-between gap-4">
			<div class="text-primary font-medium">
				{expense.isGuildCard ? "Sektionskort" : "Privat utlägg"}
			</div>
			<div>
				Skapad
				{dayjs(expense.createdAt).format("DD MMM YYYY, HH:mm")}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<MemberAvatar member={expense.member} />
			{getFullName(expense.member)}
		</div>
	</section>
	<form method="POST" action="/expenses/{expense.id}?/delete" use:enhance>
		<button
			type="submit"
			class="btn btn-square btn-error m-4"
			aria-label="delete expense"
		>
			<span class="i-mdi-delete text-3xl"></span>
		</button>
	</form>
</div>
<br />

<div class="my-4">
	<div class="font-bold opacity-60">Kvittodatum</div>
	{dayjs(expense.date).format("DD MMM YYYY")}
</div>
<div class="my-4">
	<div class="font-bold opacity-60">Beskrivning</div>
	{expense.description}
</div>

{#if canSign}
	<form
		class="mb-4"
		method="POST"
		action="/expenses/{expense.id}?/approveAll"
		use:enhance
	>
		<button class="btn btn-primary"> Godkänn allt </button>
	</form>
{/if}

{#if isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user) && !expense.hasBeenSentToBookkeeping && expense.items.every((item) => item.signedAt)}
	<form
		class="mb-4"
		method="POST"
		action="/expenses/{expense.id}?/sendToBookkeeping"
		use:enhance
	>
		<button class="btn btn-secondary">
			<span class="i-mdi-file-document-outline"></span>
			Skicka till bokföring
		</button>
	</form>
{/if}

{#if updateEnhance}
	<ul class="flex flex-wrap gap-2">
		{#each expense.items as item}
			<ExpenseReceipt
				prefix="/expenses/{expense.id}"
				{item}
				form={itemForm}
				sentToBookkeeping={expense.hasBeenSentToBookkeeping}
			/>
		{/each}
	</ul>
{:else}
	<ul class="flex flex-wrap gap-2">
		{#each expense.items as item}
			<ExpenseReceipt
				prefix="/expenses/{expense.id}"
				{item}
				form={itemForm}
				sentToBookkeeping={expense.hasBeenSentToBookkeeping}
			/>
		{/each}
	</ul>
{/if}
