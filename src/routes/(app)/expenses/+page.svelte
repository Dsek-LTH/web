<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { columns } from "./columns";
  import { getMyExpenses } from "./expense.remote";
  import ExpenseTable from "./ExpenseTable.svelte";
  import List from "@lucide/svelte/icons/list";
  import * as m from "$paraglide/messages";

  let { myExpenses } = $derived(await getMyExpenses());
</script>

<h1 class="pb-5">{m.expenses()}</h1>

<div class="flex flex-row gap-1">
  <a href="/expenses/upload"
    ><Button variant="rosa">+ {m.expense_create()}</Button></a
  >
  <a href="/expenses/all"
    ><Button variant="lila"><List /> {m.expense_allExpenses()}</Button></a
  >
</div>

<h2 class="py-5">{m.expense_myExpenses()}</h2>
<ExpenseTable {columns} data={myExpenses} />
