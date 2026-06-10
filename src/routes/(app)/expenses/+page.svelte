<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { columns } from "./columns";
  import { getExpenses } from "./expense.remote";
  import ExpenseTable from "./ExpenseTable.svelte";

  let { myExpenses } = $derived(await getExpenses());
</script>

<h1 class="pb-5">Utlägg</h1>

<a href="/expenses/upload"
  ><Button class="border-rosa-400">Skapa utlägg</Button></a
>

<h2 class="py-5">Mina utlägg</h2>
<ExpenseTable {columns} data={myExpenses} />
