<script lang="ts">
  import ScanEye from "@lucide/svelte/icons/scan-eye";
  import Download from "@lucide/svelte/icons/download";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import dayjs from "dayjs";
  import type { ExpandedExpense } from "./getExpenses";
  import MemberAvatar from "$lib/components/MemberAvatar.svelte";
  import Price from "./Price.svelte";
  import * as Card from "$lib/components/ui/card/index.js";

  const { expense }: { expense: ExpandedExpense } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={buttonVariants({ variant: "outline" })}
    ><ScanEye /></Dialog.Trigger
  >
  <Dialog.Content class="max-h-3/4 overflow-scroll  ">
    <Dialog.Header>
      <Dialog.Title
        >{expense.isGuildCard ? "Sektionskort" : "Privat utlägg"}</Dialog.Title
      >
      <Dialog.Description>
        <div class="flex flex-row items-center justify-between pt-2">
          <div class="flex flex-row items-center gap-2">
            <MemberAvatar member={expense.member}></MemberAvatar>
            {expense.member.firstName}
            {expense.member.lastName}
          </div>
          {dayjs(expense.createdAt).format("DD MMM YYYY, HH:mm")}
        </div>
      </Dialog.Description>
    </Dialog.Header>
    <div class="mx-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <div class="font-bold opacity-60">Kostnadsstsälle</div>
              {item.costCenter}
            </div>
            <div>
              <div class="font-bold opacity-60">Signerad</div>
              {item.signedAt ?? "Ej signerad"}
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
</Dialog.Root>
