<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import ExpensesTable from "../ExpensesTable.svelte";

  export let data;
  let selectedExpense: (typeof data.allExpenses)[number] | undefined =
    undefined;
</script>

<PageHeader title="All expenses" />

<a href="./" class="btn btn-ghost">
  <span class="i-mdi-file-document-multiple-outline" />
  My expenses
</a>

{#if data.allExpenses.length > 0}
  <ExpensesTable expenses={data.allExpenses} bind:selectedExpense />
  <Pagination count={data.pageCount} class="mt-4" />
{:else}
  <p class="text-center">There are no expenses</p>
{/if}
