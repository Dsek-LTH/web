<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import Price from "$lib/components/Price.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import dayjs from "dayjs";
  import type { SuperForm } from "sveltekit-superforms";
  import type { ExpandedExpense } from "../+page.server";
  import { COST_CENTERS } from "../config";
  import type { UpdateExpenseSchema } from "../types";

  export let prefix: string = "";
  export let item: ExpandedExpense["items"][number];
  export let index: number;
  export let superform: SuperForm<UpdateExpenseSchema> | undefined = undefined;

  $: user = $page.data.user;
  $: canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
  $: form = superform?.form;
  $: formItem = $form ? $form.items[index]! : item;

  let isEditing = false;
</script>

<li class="relative flex min-w-60 flex-col gap-4 rounded-md border p-4">
  {#if item.receiptUrl}
    {@const isPdf = item.receiptUrl.endsWith(".pdf")}
    <div>
      <div class="font-bold opacity-60">Kvitto</div>
      <a href={item.receiptUrl} target="_blank" class="link">
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
      <FormNumberInput {superform} field="items[{index}].amount" />
    {:else}
      <Price price={formItem.amount * 100} />
    {/if}
    <!-- it's in cents -->
  </div>
  <div>
    <div class="font-bold opacity-60">Kostnadsställe</div>
    {#if isEditing && superform}
      <FormSelect
        class="max-w-52"
        {superform}
        field="items[{index}].costCenter"
        options={COST_CENTERS.map((center) => ({
          label: `${center.name} - ${center.description} (${center.example})`,
          value: center.name,
        }))}
      />
    {:else}
      {formItem.costCenter}
    {/if}
  </div>
  {#if (formItem.comment || isEditing) && superform}
    <div>
      <div class="font-bold opacity-60">Kommentar</div>
      {#if isEditing}
        <FormInput {superform} field="items[{index}].comment" />
      {:else}
        {formItem.comment}
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
  {#if isEditing}
    <button type="submit" class="btn btn-primary">Spara</button>
  {:else if !item.signedAt && (item.signerMemberId === user?.memberId || canAlwaysSign)}
    <form method="POST" action="{prefix}?/approveReceipt" use:enhance>
      <input type="hidden" name="itemId" value={item.id} />
      <button class="btn btn-primary">Godkänn</button>
    </form>
  {/if}
  {#if superform}
    <div class="absolute right-2 top-2">
      <button
        class="btn btn-square btn-sm"
        class:btn-error={isEditing}
        on:click={() => (isEditing = !isEditing)}
      >
        {#if isEditing}
          <span class="i-mdi-close" />
        {:else}
          <span class="i-mdi-pencil" />
        {/if}
      </button>
    </div>
  {/if}
</li>
