<script lang="ts">
  import * as m from "$paraglide/messages";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import ExpensesTable from "./ExpensesTable.svelte";

  export let data;
  $: myExpenses = data.myExpenses;
  $: expensesToSign = data.expensesToSign;

  let selectedExpense: (typeof myExpenses)[number] | undefined = undefined;
</script>

<PageHeader title={m.expenses()} />

<div class="flex gap-4">
  <a href="expenses/upload" class="btn btn-outline btn-primary">
    <span class="i-mdi-file-document-outline" />
    {m.uploadExpense()}
  </a>

  <a href="expenses/all" class="btn btn-ghost">
    <span class="i-mdi-file-document-multiple-outline" />
    {m.allExpenses()}
  </a>
</div>

{#if myExpenses.length === 0 && expensesToSign.length === 0}
  <p class="text-center">Inga utlägg</p>
{:else}
  {#if expensesToSign.length > 0}
    <section class="my-4">
      <h3 class="text-lg font-semibold">Utlägg som ska signeras</h3>
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
      <h3 class="text-lg font-semibold">Mina utlägg</h3>
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
