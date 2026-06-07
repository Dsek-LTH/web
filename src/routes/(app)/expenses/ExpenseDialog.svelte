<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Card from "$lib/components/ui/card";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import dayjs from "dayjs";
  import Download from "@lucide/svelte/icons/download";
  import Price from "./Price.svelte";
  import type { ExpandedExpense } from "./getExpenses";

  let { expense }: { expense: ExpandedExpense } = $props();
</script>

<Dialog.Content class="max-h-3/4 overflow-scroll  ">
  <Dialog.Header>
    <Dialog.Title
      >{expense.isGuildCard ? "Sektionskort" : "Privat utlägg"}</Dialog.Title
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
  <div class="mx-8 grid grid-cols-1 gap-2 pb-4 sm:grid-cols-2">
    {#each expense.items as item (item.id)}
      <Card.Root>
        <Card.Content>
          <a
            href={item.receiptUrl}
            target="_blank"
            class="flex flex-row gap-1 underline"
            ><Download size="18" />Ladda ner kvitto</a
          >
          <div>
            <div class="font-bold opacity-60">Kronor</div>
            <Price price={item.amount} />
          </div>
          <div>
            <div class="font-bold opacity-60">Kostnadsställe</div>
            {item.costCenter}
          </div>
          <div>
            <div class="font-bold opacity-60">Signerad</div>
            {dayjs(item.signedAt).format("D MMM YYYY, HH:mm") ?? "Ej signerad"}
          </div>
          <div>
            <div class="font-bold opacity-60">Signeras av</div>
            {item.signer.firstName}
            {item.signer.lastName}
          </div>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</Dialog.Content>
