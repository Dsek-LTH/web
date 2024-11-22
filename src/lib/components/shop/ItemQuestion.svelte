<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import ItemQuestionOption from "$lib/components/shop/ItemQuestionOption.svelte";
  import { QuestionType } from "$lib/utils/shop/types";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import type { Writable } from "svelte/store";
  import {
    arrayProxy,
    formFieldProxy,
    type SuperForm,
  } from "sveltekit-superforms/client";

  let {
    superForm,
    field,
    onRemove,
  }: {
    superForm: SuperForm;
    field: `questions[${number}]`;
    onRemove: () => void;
  } = $props();

  const { value: type } = formFieldProxy(superForm, `${field}.type`);

  const { values: options, errors: optionsErrors } = arrayProxy(
    superForm,
    `${field}.options`,
  ) as {
    values: Writable<TicketSchema["questions"][number]["options"]>;
    errors: Writable<string[] | undefined>;
  };

  $effect(() => {
    if ($type !== QuestionType.MultipleChoice) {
      if ($options) $options = [];
    }
  });
  let questionIndex = $derived(Number(field.match(/\d+/)![0]));
</script>

<div class="rounded-box bg-base-300 p-4">
  <h3 class="text-lg font-semibold">Fråga {questionIndex + 1}</h3>
  <FormInput {superForm} field="{field}.id" type="hidden" />
  <FormInput
    {superForm}
    field="{field}.title"
    label="Fråga"
    placeholder="Önskar du...?"
  />
  <FormInput {superForm} field="{field}.description" label="Förklaring" />
  <FormInput {superForm} field="{field}.titleEn" label="Fråga (EN)" />
  <FormInput
    {superForm}
    field="{field}.descriptionEn"
    label="Förklaring (EN)"
  />
  <FormSelect
    {superForm}
    field="{field}.type"
    label="Typ"
    options={[
      {
        value: QuestionType.MultipleChoice,
        label: "Multiple choice",
      },
      {
        value: QuestionType.Text,
        label: "Free text",
      },
    ]}
  />
  <FormCheckbox
    {superForm}
    field="{field}.forExternalsOnly"
    label="Enbart för icke-inloggade?"
    explanation="Om du vill att frågan endast ska visas för icke-inloggade köpare."
  />
  {#if $type === QuestionType.MultipleChoice}
    <Labeled label="Svarsalternativ" error={$optionsErrors}></Labeled>
    <div class="flex flex-wrap gap-2 [&>*]:flex-1">
      {#if $options}
        <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- We only need the index -->
        {#each $options as _, index}
          <ItemQuestionOption
            {superForm}
            field="{field}.options[{index}]"
            onRemove={$options.length === 1
              ? undefined
              : () => {
                  if (!$options) return;
                  else $options = $options.filter((_, i) => i !== index);
                }}
          />
        {/each}
      {/if}
      <div class="flex items-center justify-center">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          type="button"
          class="btn btn-primary btn-lg m-8"
          onclick={() => {
            if ($options)
              $options = [...$options, { answer: "", extraPrice: null }];
            else $options = [{ answer: "", extraPrice: null }];
          }}
        >
          <span class="i-mdi-plus-bold text-xl"></span></button
        >
      </div>
    </div>
  {/if}
  <button class="btn btn-error mt-2" onclick={onRemove}>Ta bort fråga</button>
</div>
