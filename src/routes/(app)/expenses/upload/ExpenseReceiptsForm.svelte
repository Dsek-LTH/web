<script lang="ts">
  import {
    arrayProxy,
    type ArrayProxy,
    type SuperForm,
  } from "sveltekit-superforms";
  import ExpenseReceipt from "./ExpenseReceipt.svelte";
  import type { ReceiptSchema, ExpenseSchema } from "../types";
  import createBasicReceipt from "../baseItem";
  import * as m from "$paraglide/messages";

  export let superform: SuperForm<ExpenseSchema>;
  const proxy = arrayProxy(superform, "receipts") as ArrayProxy<ReceiptSchema>;
  $: values = proxy.values;
  $: errors = proxy.errors;
</script>

<section>
  <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each $values as _, index}
      <ExpenseReceipt
        {superform}
        {index}
        onRemove={() => {
          $values = [...$values.slice(0, index), ...$values.slice(index + 1)];
        }}
      />
    {/each}
  </div>
  <button
    type="button"
    class="btn mt-4"
    on:click={() => {
      if ($values === undefined) {
        $values = [createBasicReceipt()];
      } else {
        $values = [...$values, createBasicReceipt()];
      }
    }}
  >
    + {m.add_receipt()}
  </button>

  {#if $errors}
    {#each $errors as error}
      <div class="label">
        <span class="label-text-alt text-error">
          {error}
        </span>
      </div>
    {/each}
  {/if}
</section>
