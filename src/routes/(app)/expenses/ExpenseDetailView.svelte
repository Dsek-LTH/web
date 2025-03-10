<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import dayjs from "dayjs";
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import type { ExpandedExpense } from "./+page.server";
  import ExpenseReceipt from "./[id]/ExpenseReceipt.svelte";
  import type { UpdateExpenseSchema, UpdateItemSchema } from "./types";

  $: user = $page.data.user;
  export let expense: ExpandedExpense;
  $: canSign =
    expense.items.some((item) => !item.signedAt) &&
    (expense.items.some((item) => item.signerMemberId === user?.memberId) ||
      isAuthorized(apiNames.EXPENSES.CERTIFICATION, user));

  export let superform: SuperForm<UpdateExpenseSchema> | undefined = undefined;
  export let itemForm: SuperValidated<UpdateItemSchema> | undefined = undefined;
  $: updateEnhance = superform?.enhance;
</script>

<!-- Header with meta info (guild card, who sent it, and when) -->
<section class="inline-block rounded-md border border-base-content px-4 py-2">
  <div class="flex justify-between gap-4">
    <div class="font-medium text-primary">
      {expense.isGuildCard ? "Sektionskort" : "Privat utlägg"}
    </div>
    <div>
      Skapad
      {dayjs(expense.createdAt).format("DD MMM YYYY, HH:mm")}
    </div>
  </div>
  <div class="flex items-center gap-2">
    <MemberAvatar member={expense.member} />
    {getFullName(expense.member)}
  </div>
</section>
<br />

<div class="my-4">
  <div class="font-bold opacity-60">Kvittodatum</div>
  {dayjs(expense.date).format("DD MMM YYYY")}
</div>
<div class="my-4">
  <div class="font-bold opacity-60">Beskrivning</div>
  {expense.description}
</div>

{#if canSign}
  <form
    class="mb-4"
    method="POST"
    action="/expenses/{expense.id}?/approveAll"
    use:enhance
  >
    <button class="btn btn-primary"> Godkänn allt </button>
  </form>
{/if}

{#if isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user) && !expense.hasBeenSentToBookkeeping && expense.items.every((item) => item.signedAt)}
  <form
    class="mb-4"
    method="POST"
    action="/expenses/{expense.id}?/sendToBookkeeping"
    use:enhance
  >
    <button class="btn btn-secondary">
      <span class="i-mdi-file-document-outline" />
      Skicka till bokföring
    </button>
  </form>
{/if}

{#if updateEnhance}
  <form use:updateEnhance method="POST" action="/expenses/{expense.id}?/update">
    <ul class="flex flex-wrap gap-2">
      {#each expense.items as item}
        <ExpenseReceipt
          prefix="/expenses/{expense.id}"
          {item}
          form={itemForm}
          sentToBookkeeping={expense.hasBeenSentToBookkeeping}
        />
      {/each}
    </ul>
  </form>
{:else}
  <ul class="flex flex-wrap gap-2">
    {#each expense.items as item}
      <ExpenseReceipt
        prefix="/expenses/{expense.id}"
        {item}
        form={itemForm}
        sentToBookkeeping={expense.hasBeenSentToBookkeeping}
      />
    {/each}
  </ul>
{/if}
