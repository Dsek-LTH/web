<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import Price from "$lib/components/Price.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import { superForm } from "$lib/utils/client/superForms";
  import dayjs from "dayjs";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { ExpandedExpense } from "../+page.server";
  import { COST_CENTERS } from "../config";
  import type { UpdateItemSchema } from "../types";

  export let prefix = "";
  export let item: ExpandedExpense["items"][number];
  export let form: SuperValidated<UpdateItemSchema> | undefined = undefined;
  $: superform = form
    ? superForm(
        {
          ...form,
          data: {
            id: item.id,
            costCenter: item.costCenter,
            amount: item.amount,
            comment: item.comment,
          },
        },
        {
          id: item.id,
          onResult: (event) => {
            if (event.result.type === "success") {
              isEditing = false;
            }
          },
        },
      )
    : undefined;

  $: user = $page.data.user;
  $: canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);

  let isEditing = false;
  $: updateEnhance = superform?.enhance ?? enhance;

  let showImage = false;
</script>

<li
  class="relative flex min-w-60 flex-col gap-4 rounded-md border border-base-content p-4"
>
  <form method="POST" action="{prefix}?/updateReceipt" use:updateEnhance>
    <input type="hidden" name="id" value={item.id} />
    {#if item.receiptUrl}
      {@const isPdf = item.receiptUrl.endsWith(".pdf")}
      <div>
        <div class="font-bold opacity-60">Kvitto</div>
        <a
          href={item.receiptUrl}
          target="_blank"
          class="link"
          on:click|preventDefault={() => (showImage = true)}
        >
          {#if isPdf}
            PDF <span class="i-mdi-file-pdf" />
          {:else}
            <img src={item.receiptUrl} alt="Kvitto" class="max-h-52 max-w-52" />
          {/if}
        </a>
      </div>
    {/if}
    <div>
      <div class="font-bold opacity-60">Kronor</div>
      {#if isEditing && superform}
        <FormNumberInput {superform} field="amount" />
      {:else}
        <Price price={item.amount * 100} />
      {/if}
      <!-- it's in cents -->
    </div>
    <div>
      <div class="font-bold opacity-60">Kostnadsställe</div>
      {#if isEditing && superform}
        <FormSelect
          class="max-w-52"
          {superform}
          field="costCenter"
          options={COST_CENTERS.map((center) => ({
            label: `${center.name} - ${center.description} (${center.example})`,
            value: center.name,
          }))}
        />
      {:else}
        {item.costCenter}
      {/if}
    </div>
    {#if (item.comment || isEditing) && superform}
      <div>
        <div class="font-bold opacity-60">Kommentar</div>
        {#if isEditing}
          <FormInput {superform} field="comment" />
        {:else}
          {item.comment}
        {/if}
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
        {item.signerMemberId === user?.memberId
          ? "Dig"
          : getFullName(item.signer)}
      </div>
    {/if}
    {#if isEditing && superform}
      <FormSubmitButton {superform} class="btn btn-primary"
        >Spara</FormSubmitButton
      >
    {:else if item.signerMemberId === user?.memberId || canAlwaysSign || item.signedByMemberId === user?.memberId}
      {#if !item.signedAt}
        <form method="POST" action="{prefix}?/approveReceipt" use:enhance>
          <input type="hidden" name="itemId" value={item.id} />
          <button class="btn btn-primary">Godkänn</button>
        </form>
      {:else}
        <form method="POST" action="{prefix}?/disapproveReceipt" use:enhance>
          <input type="hidden" name="itemId" value={item.id} />
          <button class="btn btn-error">Av-godkänn</button>
        </form>
      {/if}
    {/if}
    {#if superform && !item.signedAt}
      <div class="absolute right-2 top-2">
        <button
          type="button"
          class="btn btn-square btn-sm"
          class:btn-error={isEditing}
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {#if isEditing}
            <span class="i-mdi-close" />
          {:else}
            <span class="i-mdi-pencil" />
          {/if}
        </button>
      </div>
    {/if}
  </form>
  <Modal show={showImage} backdrop onClose={() => (showImage = false)}>
    <img src={item.receiptUrl} alt="Kvitto" class="h-full w-full" />
    <a href={item.receiptUrl} target="_blank" class="btn btn-primary mt-4"
      >Ladda ner</a
    >
  </Modal>
</li>
