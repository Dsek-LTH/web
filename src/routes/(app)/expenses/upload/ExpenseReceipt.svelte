<script lang="ts">
  import FormFileInput from "$lib/components/forms/FormFileInput.svelte";
  import * as m from "$paraglide/messages";

  import {
    arrayProxy,
    type ArrayProxy,
    type SuperForm,
  } from "sveltekit-superforms";
  import { createBasicReceiptRow } from "../baseItem";
  import type { ExpenseSchema, ReceiptRowSchema } from "../types";
  import ExpenseReceiptRow from "./ExpenseReceiptRow.svelte";

  export let superform: SuperForm<ExpenseSchema>;
  export let index: number;
  export let onRemove: () => void;

  $: proxy = arrayProxy(
    superform,
    `receipts[${index}].rows`,
  ) as ArrayProxy<ReceiptRowSchema>;
  $: values = proxy.values;
  $: errors = proxy.errors;

  let receiptPhotos: string[] | undefined = undefined;
  const onFileSelected = async (
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) => {
    let images = event.currentTarget.files;
    if (!images) return;
    let reader = new FileReader();
    receiptPhotos = [];
    for (let image of images) {
      await new Promise((resolve) => {
        reader.readAsDataURL(image);
        reader.onload = (e) => {
          let result = e.target?.result ?? undefined;
          // If array buffer, convert to base64
          if (result instanceof ArrayBuffer) {
            receiptPhotos = [
              ...receiptPhotos!,
              btoa(
                new Uint8Array(result).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  "",
                ),
              ),
            ];
          } else if (result) {
            receiptPhotos = [...receiptPhotos!, result];
          }
          resolve(true);
        };
      });
    }
  };
</script>

<div class="relative rounded-box bg-base-300 p-4">
  <FormFileInput
    {superform}
    label={m.receipt()}
    field={`receipts[${index}].image`}
    onChange={(e) => onFileSelected(e)}
    accept="application/pdf"
    multiple
  />
  {#if receiptPhotos !== undefined}
    {#each receiptPhotos as photo}
      {#if !photo.startsWith("data:application/pdf")}
        <img src={photo} alt="Kvitto" />
      {/if}
    {/each}
  {/if}
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each $values as _, i}
    <ExpenseReceiptRow
      {superform}
      index={i}
      receiptIndex={index}
      onRemove={$values.length === 1
        ? undefined
        : () => {
            $values = [...$values.slice(0, i), ...$values.slice(i + 1)];
          }}
    />
  {/each}
  <button
    type="button"
    class="btn mt-4"
    on:click={() => {
      if ($values === undefined) {
        $values = [createBasicReceiptRow()];
      } else {
        $values = [
          ...$values,
          createBasicReceiptRow(
            $values.length > 0
              ? $values[$values.length - 1]?.costCenter
              : undefined,
          ),
        ];
      }
    }}
  >
    + {m.add_row()}
  </button>
  <button type="button" class="absolute right-4 top-4" on:click={onRemove}>
    X
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
</div>
