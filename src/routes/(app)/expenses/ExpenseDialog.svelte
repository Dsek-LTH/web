<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Card from "$lib/components/ui/card";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import dayjs from "dayjs";
  import Download from "@lucide/svelte/icons/download";
  import Price from "./Price.svelte";
  import type { ExpandedExpense } from "./getExpenses";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import Check from "@lucide/svelte/icons/check";
  import FileText from "@lucide/svelte/icons/file-text";
  import { approveAll } from "./sign.remote";
  import { sendToBookkeeping } from "./bookkeeping.remote";

  let { expense }: { expense: ExpandedExpense } = $props();

  let user = $derived(page.data.user);
  let canSign = $derived(
    expense.items.some((item) => !item.signedAt) &&
      (expense.items.some((item) => item.signerMemberId === user?.memberId) ||
        isAuthorized(apiNames.EXPENSES.CERTIFICATION, user)),
  );
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

  <div class="mx-4">
    {#if canSign}
      <Button onclick={() => approveAll(expense.id)}
        ><Check /> Godkänn allt</Button
      >
    {/if}

    {#if isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user) && !expense.hasBeenSentToBookkeeping && expense.items.every((item) => item.signedAt)}
      <Button onclick={() => sendToBookkeeping(expense.id)} variant="lila">
        <FileText />
        Skicka till bokföring
      </Button>
    {/if}
  </div>

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
