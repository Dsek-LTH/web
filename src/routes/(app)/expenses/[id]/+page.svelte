<script lang="ts">
  import { enhance } from "$app/forms";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import Price from "$lib/components/Price.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import { superForm } from "$lib/utils/client/superForms";
  import dayjs from "dayjs";

  export let data;
  $: expense = data.expense;
  $: canSign =
    expense.items.some((item) => !item.signedAt) &&
    (expense.items.some((item) => item.signerMemberId === data.user.memberId) ||
      isAuthorized(apiNames.EXPENSES.CERTIFICATION, data.user));
  $: canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, data.user);

  const superform = superForm(data.updateForm, {
    dataType: "json",
  });
</script>

<PageHeader title="Utlägg #{expense.id}" />

<!-- Header with meta info (guild card, who sent it, and when) -->
<section class="inline-block rounded-box border px-4 py-2">
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
  <form class="mb-4" method="POST" action="?/approveAll" use:enhance>
    <button class="btn btn-primary"> Godkänn allt </button>
  </form>
{/if}

<ul class="flex flex-wrap gap-2">
  {#each expense.items as item}
    <li class="flex min-w-60 flex-col gap-4 rounded-md border p-4">
      {#if item.receiptUrl}
        {@const isPdf = item.receiptUrl.endsWith(".pdf")}
        <div>
          <div class="font-bold opacity-60">Kvitto</div>
          <a href={item.receiptUrl} target="_blank" class="link">
            {#if isPdf}
              PDF <span class="i-mdi-file-pdf" />
            {:else}
              <img src={item.receiptUrl} alt="Kvitto" />
            {/if}
          </a>
        </div>
      {/if}
      <div>
        <div class="font-bold opacity-60">Kronor</div>
        <Price price={item.amount * 100} />
        <!-- it's in cents -->
      </div>
      <div>
        <div class="font-bold opacity-60">Kostnadsställe</div>
        {item.costCenter}
      </div>
      {#if item.comment}
        <div>
          <div class="font-bold opacity-60">Kommentar</div>
          {item.comment}
        </div>
      {/if}
      <div>
        <div class="font-bold opacity-60">Signerad</div>
        {#if item.signedAt}
          {dayjs(item.signedAt).format("DD MMM YYYY, HH:mm")}
        {:else}
          Ej signerad
        {/if}
      </div>
      {#if item.signedBy}
        <div>
          <div class="font-bold opacity-60">Signerat av</div>
          {getFullName(item.signedBy)}
        </div>
      {:else}
        <div>
          <div class="font-bold opacity-60">Signeras av</div>
          {item.signerMemberId === data.user.memberId
            ? "Dig"
            : getFullName(item.signer)}
        </div>
      {/if}
      {#if !item.signedAt && (item.signerMemberId === data.user.memberId || canAlwaysSign)}
        <form method="POST" action="?/approveReceipt" use:enhance>
          <input type="hidden" name="itemId" value={item.id} />
          <button class="btn btn-primary">Godkänn</button>
        </form>
      {/if}
    </li>
  {/each}
</ul>
