<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { columns } from "../columns";
  import ExpenseTable from "../ExpenseTable.svelte";
  import List from "@lucide/svelte/icons/list";
  import * as m from "$paraglide/messages";
  import * as Tabs from "$lib/components/ui/tabs";
  import { getFilteredExpenses } from "../expense.remote";
  import Pagination from "$lib/components/Pagination.svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { browser } from "$app/environment";

  let { allExpenses, pageCount } = $derived(await getFilteredExpenses());

  const setFilterLink = async (filter: string) => {
    if (!browser) return;
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("expense-filter", filter.toString());
    goto(resolve(`/expenses/all/?${searchParams.toString()}`), {
      invalidateAll: true,
    });
  };
</script>

<h1 class="pb-5">{m.expenses()}</h1>

<div class="flex flex-row gap-1">
  <a href="/expenses/upload"
    ><Button variant="rosa">+ {m.expense_create()}</Button></a
  >
  <a href="/expenses"
    ><Button variant="lila"><List /> {m.expense_myExpenses()}</Button></a
  >
</div>

<h2 class="mt-4">{m.expense_allExpenses()}</h2>

<Tabs.Root
  class="mt-4 mb-2"
  value={page.url.searchParams.get("expense-filter") ?? "all"}
>
  <Tabs.List>
    <Tabs.Trigger onclick={() => setFilterLink("all")} value="all"
      >{m.expense_allExpenses()}</Tabs.Trigger
    >
    <Tabs.Trigger onclick={() => setFilterLink("not-signed")} value="not-signed"
      >{m.expense_unsigned()}</Tabs.Trigger
    >
    <Tabs.Trigger onclick={() => setFilterLink("signed")} value="signed"
      >{m.expense_unbooked()}</Tabs.Trigger
    >
    <Tabs.Trigger onclick={() => setFilterLink("in-book")} value="in-book"
      >{m.expense_booked()}</Tabs.Trigger
    >
  </Tabs.List>
</Tabs.Root>
<ExpenseTable {columns} data={allExpenses} />
<Pagination class="mt-2" {pageCount} />
