<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import dayjs from "dayjs";
  import ExpenseContent from "../ExpenseContent.svelte";
  import { getExpense } from "../expense.remote";
  import { page } from "$app/state";
  import * as m from "$paraglide/messages";
  import { Badge } from "$lib/components/ui/badge";
  import Trash from "@lucide/svelte/icons/trash";

  let expense = $derived(await getExpense(Number(page.params.id)));
</script>

{#if expense}
  <h3>
    {expense.isGuildCard ? "Sektionskort" : "Privat utlägg"}
    {#if expense.removedAt}
      <Badge class="bg-red-500 text-white"
        ><Trash /> {m.expense_removed()}</Badge
      >
    {/if}
  </h3>

  <div class="flex flex-row items-center justify-between py-2">
    <div class="flex flex-row items-center gap-2">
      <MemberAvatar member={expense.member} />
      {expense.member.firstName}
      {expense.member.lastName}
    </div>
    {dayjs(expense.createdAt).format("D MMM YYYY, HH:mm")}
  </div>
  <ExpenseContent {expense} />
{/if}
