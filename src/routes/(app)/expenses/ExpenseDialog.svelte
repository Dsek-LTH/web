<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import dayjs from "dayjs";
  import type { ExpandedExpense } from "./getExpenses";
  import ExpenseContent from "./ExpenseContent.svelte";
  import * as m from "$paraglide/messages";

  let { expense }: { expense: ExpandedExpense } = $props();
</script>

<Dialog.Content class="max-h-3/4 overflow-scroll  ">
  <Dialog.Header>
    <Dialog.Title
      >{expense.isGuildCard
        ? m.expense_guildcard()
        : m.expense_private_expense()}</Dialog.Title
    >
    <Dialog.Description>
      <div class="flex flex-row items-center justify-between pt-2">
        <div class="flex flex-row items-center gap-2">
          <MemberAvatar member={expense.member} />
          {expense.member.firstName}
          {expense.member.lastName}
        </div>
        {dayjs(expense.createdAt).format("D MMM YYYY, HH:mm")}
      </div>
    </Dialog.Description>
  </Dialog.Header>
  <ExpenseContent dialog {expense} />
</Dialog.Content>
