<script lang="ts">
	import { page } from "$app/stores";
	import PageHeader from "$lib/components/nav/PageHeader.svelte";
	import Pagination from "$lib/components/Pagination.svelte";
	import ExpenseDetailView from "../ExpenseDetailView.svelte";
	import ExpensesTable from "../ExpensesTable.svelte";

	export let data;
	let selectedExpense: (typeof data.allExpenses)[number] | undefined =
		undefined;

	let filter = ($page.url.searchParams.get("expense-filter") ?? "all") as
		| "all"
		| "signed"
		| "not-signed"
		| "in-book";

	let filterForm: HTMLFormElement;
</script>

<PageHeader title="All expenses" />

<a href="./" class="btn btn-ghost">
	<span class="i-mdi-file-document-multiple-outline"></span>
	My expenses
</a>

<form
	bind:this={filterForm}
	method="GET"
	class="join [&>label:not(:has(input:checked))]:btn-outline [&>label:has(input:checked)]:pointer-events-none [&>label>input]:hidden"
>
	<label class="btn btn-primary join-item">
		Alla utlägg
		<!-- default is "all" -->
		<input
			type="radio"
			name="expense-filter"
			value="all"
			bind:group={filter}
			on:change={() => filterForm.requestSubmit()}
		/>
	</label>
	<label class="btn btn-primary join-item">
		Ej signerade utlägg
		<input
			type="radio"
			name="expense-filter"
			value="not-signed"
			bind:group={filter}
			on:change={() => filterForm.requestSubmit()}
		/>
	</label>
	<label class="btn btn-primary join-item">
		Signerade, ej bokförda
		<input
			type="radio"
			name="expense-filter"
			value="signed"
			bind:group={filter}
			on:change={() => filterForm.requestSubmit()}
		/>
	</label>
	<label class="btn btn-primary join-item">
		Bokförda
		<input
			type="radio"
			name="expense-filter"
			value="in-book"
			bind:group={filter}
			on:change={() => filterForm.requestSubmit()}
		/>
	</label>
</form>
{#if data.allExpenses.length > 0}
	<ExpensesTable expenses={data.allExpenses} bind:selectedExpense />
	<Pagination count={data.pageCount} class="mt-4" />
{:else}
	<p class="my-8 text-center">Inga utlägg</p>
{/if}

{#if selectedExpense}
	<div class="bg-base-300 my-8 rounded-md p-4">
		<ExpenseDetailView expense={selectedExpense} />
	</div>
{/if}
