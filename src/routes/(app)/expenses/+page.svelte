<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import ExpensesTable from "./ExpensesTable.svelte";

  export let data;
  $: myExpenses = data.myExpenses;
  $: expensesToSign = data.expensesToSign;

  let selectedExpense: (typeof myExpenses)[number] | undefined = undefined;
</script>

<PageHeader title="Expenses" />

<div class="flex gap-4">
  <a href="expenses/upload" class="btn btn-outline btn-primary">
    <span class="i-mdi-file-document-outline" />
    Upload expense
  </a>

  <a href="expenses/all" class="btn btn-ghost">
    <span class="i-mdi-file-document-multiple-outline" />
    All expenses
  </a>
</div>

{#if myExpenses.length === 0 && expensesToSign.length === 0}
  <p class="text-center">You have no relevant expenses</p>
{:else}
  {#if expensesToSign.length > 0}
    <section class="my-4">
      <h3 class="text-lg font-semibold">Expenses to sign</h3>
      <ExpensesTable
        expenses={expensesToSign}
        bind:selectedExpense
        hide={{
          signer: true,
          signed: true,
        }}
      />
    </section>
  {/if}
  {#if myExpenses.length > 0}
    <section class="my-4">
      <h3 class="text-lg font-semibold">My expenses</h3>
      <ExpensesTable
        expenses={myExpenses}
        bind:selectedExpense
        hide={{
          from: true,
        }}
      />
    </section>
  {/if}
{/if}
