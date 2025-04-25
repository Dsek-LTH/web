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

  interface Props {
    superform: SuperForm<ExpenseSchema>;
    index: number;
    onRemove: () => void;
  }

  let { superform, index, onRemove }: Props = $props();

  let proxy = $derived(
    arrayProxy(
      superform,
      `receipts[${index}].rows`,
    ) as ArrayProxy<ReceiptRowSchema>,
  );
  let values = $derived(proxy.values);
  let errors = $derived(proxy.errors);

  let receiptPhotos: string[] | undefined = $state(undefined);
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
    accept="image/*,application/pdf"
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
    onclick={() => {
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
  <button type="button" class="absolute right-4 top-4" onclick={onRemove}>
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
