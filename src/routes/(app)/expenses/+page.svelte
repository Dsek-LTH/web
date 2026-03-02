<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { columns } from "./columns";
  import ExpenseTable from "./ExpenseTable.svelte";

  const { data } = $props();
</script>

<h1 class="pb-5">Utlägg</h1>
<Button variant="outline" class="border-rosa-400">Skapa utlägg</Button>
<h2 class="py-5">Mina utlägg</h2>
<ExpenseTable {columns} data={data.myExpenses} />
