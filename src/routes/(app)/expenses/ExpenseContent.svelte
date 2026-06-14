<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import dayjs from "dayjs";
  import Download from "@lucide/svelte/icons/download";
  import Price from "./Price.svelte";
  import type { ExpandedExpense } from "./getExpenses";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { page } from "$app/state";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import Check from "@lucide/svelte/icons/check";
  import FileText from "@lucide/svelte/icons/file-text";
  import Trash from "@lucide/svelte/icons/trash";
  import { approveAll, approveReceipt, unapproveReceipt } from "./sign.remote";
  import { sendToBookkeeping } from "./bookkeeping.remote";
  import { deleteExpense, updateReceipt } from "./expense.remote";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { cn } from "$lib/utils";
  import { Label } from "$lib/components/ui/label";
  import * as m from "$paraglide/messages";
  import { Input } from "$lib/components/ui/input";
  import Coins from "@lucide/svelte/icons/coins";
  import Pen from "@lucide/svelte/icons/pen";
  import X from "@lucide/svelte/icons/x";
  import * as Select from "$lib/components/ui/select";
  import { costCenters } from "./config";
  import { PiggyBank } from "@lucide/svelte";
  import { enhanceWithToast, type RemoteForm } from "$lib/stores/toast";

  let {
    expense,
    dialog = false,
  }: {
    expense: ExpandedExpense;
    dialog?: boolean;
  } = $props();

  let user = $derived(page.data.user);
  let canSign = $derived(
    !expense.hasBeenSentToBookkeeping &&
      (expense.items.some((item) => item.signerMemberId === user?.memberId) ||
        isAuthorized(apiNames.EXPENSES.CERTIFICATION, user)),
  );

  let editingId: string | undefined = $state(undefined);
  let deleteDialogOpen = $state(false);
</script>

<div class={dialog ? "mx-4" : ""}>
  <div class={cn("flex flex-row", dialog ? "" : "mb-2")}>
    {#if canSign && expense.items.some((item) => !item.signedBy)}
      <Button onclick={() => approveAll(expense.id)}
        ><Check /> {m.expense_approveAll()}</Button
      >
    {/if}

    {#if isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user) && !expense.hasBeenSentToBookkeeping && expense.items.every((item) => item.signedAt)}
      <Button onclick={() => sendToBookkeeping(expense.id)} variant="lila">
        <FileText />
        {m.expense_sendToBookkeeping()}
      </Button>
    {/if}

    {#if !expense.items.some((item) => item.signedAt) && !expense.hasBeenSentToBookkeeping}
      <AlertDialog.Root bind:open={deleteDialogOpen}>
        <AlertDialog.Trigger
          class={cn(
            "ml-auto",
            buttonVariants({ size: "icon-sm", variant: "destructive" }),
          )}
        >
          <Trash />
        </AlertDialog.Trigger>
        <AlertDialog.Content class="z-200">
          <AlertDialog.Header>
            <AlertDialog.Title>{m.expense_remove_header()}</AlertDialog.Title>
            <AlertDialog.Description>
              {m.expense_remove_description()}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>{m.cancel()}</AlertDialog.Cancel>
            <AlertDialog.Action
              onclick={() => {
                deleteExpense(expense.id);
                deleteDialogOpen = false;
                setTimeout(
                  () =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "Escape" }),
                    ),
                  200,
                ); // close the dialog
              }}>{m.delete_delete()}</AlertDialog.Action
            >
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    {/if}
  </div>
</div>

<div class="{dialog ? 'mx-8' : ''} grid grid-cols-1 gap-2 pb-4 sm:grid-cols-2">
  {#each expense.items as item (item.id)}
    <Card.Root>
      <Card.Content class="relative flex flex-col gap-0.5">
        {#if !item.signedBy}
          <Button
            variant="lila"
            size="sm"
            class="absolute -top-2 right-4 w-fit"
            onclick={() =>
              editingId == item.id
                ? (editingId = undefined)
                : (editingId = item.id)}
            >{#if editingId == item.id}<X />{:else}<Pen />{/if}{!dialog
              ? editingId == item.id
                ? m.cancel()
                : m.expense_edit()
              : ""}</Button
          >
        {/if}
        <a
          href={item.receiptUrl}
          target="_blank"
          class="flex flex-row gap-1 underline"
          ><Download size="18" />{m.expense_download_receipt()}</a
        >

        {#if editingId == item.id}
          {@const receiptForm = updateReceipt.for(item.id)}
          {@const krAmount = item.amount / 100}
          <form
            {...enhanceWithToast(
              receiptForm as unknown as RemoteForm,
              async (form) => {
                await form.submit();
                editingId = undefined;
              },
            )}
            onload={() => {
              receiptForm.fields.costCenter.set(item.costCenter);
            }}
          >
            <div class="flex flex-col gap-1.5">
              <Label>{m.expense_amount()}</Label>
              <Input
                step="0.01"
                {...receiptForm.fields.amount.as("number", krAmount)}
                ><Coins /></Input
              >
            </div>
            <div class="flex w-full flex-col gap-1.5">
              <Label>{m.expense_type()}</Label>
              <Select.Root
                name={receiptForm.fields.costCenter.as("text").name}
                type="single"
                bind:value={receiptForm.fields.costCenter.value,
                (v) =>
                  receiptForm.fields.costCenter.set(
                    v == "" ? (item.costCenter ?? "") : (v ?? ""),
                  )}
              >
                <Select.Trigger class="bg-background w-full"
                  ><PiggyBank />{receiptForm.fields.costCenter.as(
                    "text",
                    item.costCenter,
                  ).value}
                </Select.Trigger>
                <Select.Content>
                  {#each costCenters as costCenter (costCenter.value)}
                    <Select.Item value={costCenter.value}
                      >{costCenter.label}</Select.Item
                    >
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{m.receipt_comment()}</Label>
              <Input
                {...receiptForm.fields.comment.as("text", item.comment ?? "")}
                ><Pen /></Input
              >
            </div>
            <Button class="mt-1.5" type="submit" variant="lila"
              >{m.save()}</Button
            >
          </form>
        {:else}
          <div>
            <div class="font-bold opacity-60">{m.expense_amount()}</div>
            <Price price={item.amount} />
          </div>
          <div>
            <div class="font-bold opacity-60">{m.expense_type()}</div>
            {item.costCenter}
          </div>
          {#if item.comment}
            <div>
              <div class="font-bold opacity-60">{m.expense_comment()}</div>
              {item.comment}
            </div>
          {/if}
        {/if}

        <div>
          <div class="font-bold opacity-60">{m.expense_signed()}</div>
          {item.signedAt
            ? dayjs(item.signedAt).format("D MMM YYYY, HH:mm")
            : m.expense_notSigned()}
        </div>

        <div>
          {#if item.signedBy}
            <div class="font-bold opacity-60">{m.expense_signedBy()}</div>
            {item.signedBy.firstName}
            {item.signedBy.lastName}
          {:else}
            <div class="font-bold opacity-60">{m.expense_signer()}</div>
            {item.signer.firstName}
            {item.signer.lastName}
          {/if}
        </div>
        {#if canSign}
          {#if item.signedBy}
            <Button
              variant="lila"
              class="mt-2 self-center"
              onclick={() =>
                unapproveReceipt({ itemId: item.id, expenseId: expense.id })}
              ><X /> {m.expense_unapprove()}</Button
            >
          {:else}
            <Button
              class="mt-2 self-center"
              onclick={() =>
                approveReceipt({ itemId: item.id, expenseId: expense.id })}
              ><Check /> {m.expense_approve()}</Button
            >
          {/if}
        {/if}
      </Card.Content>
    </Card.Root>
  {/each}
</div>
