<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import ItemQuestionOption from "$lib/components/shop/ItemQuestionOption.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import { QuestionType } from "$lib/server/shop/questions";
  import type { Writable } from "svelte/store";
  import {
    arrayProxy,
    formFieldProxy,
    type SuperForm,
  } from "sveltekit-superforms/client";
  export let superform: SuperForm<TicketSchema>;
  export let field: `questions[${number}]`;

  const {
    value: type,
    errors: typeErrors,
    constraints: typeConstraints,
  } = formFieldProxy(superform, `${field}.type`);

  const { values: options, errors: optionsErrors } = arrayProxy(
    superform,
    `${field}.options`,
  ) as {
    values: Writable<TicketSchema["questions"][number]["options"]>;
    errors: Writable<string[] | undefined>;
  };
</script>

<div>
  <FormInput
    {superform}
    field="{field}.title"
    label="Fråga"
    placeholder="Önskar du...?"
  />
  <FormInput {superform} field="{field}.description" label="Förklaring" />
  <FormInput {superform} field="{field}.titleEn" label="Fråga (EN)" />
  <FormInput
    {superform}
    field="{field}.descriptionEn"
    label="Förklaring (EN)"
  />
  <Labeled label="Typ" error={$typeErrors}>
    <select name="type" bind:value={$type} {...$typeConstraints}>
      <option value={QuestionType.MultipleChoice}>Multiple choice</option>
      <option value={QuestionType.Text}>Free text</option>
    </select>
  </Labeled>
  <FormCheckbox
    {superform}
    field="{field}.forExternalsOnly"
    label="Enbart för icke-inloggade?"
  />
  {#if $type === QuestionType.MultipleChoice}
    <Labeled label="Svarsalternativ" error={$optionsErrors}>
      {#if $options}
        <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- We only need the index -->
        {#each $options as _, index}
          <ItemQuestionOption
            {superform}
            field="{field}.options[{index}]"
            onRemove={() => {
              if (!$options) return;
              $options = $options.filter((_, i) => i !== index);
            }}
          />
        {/each}
      {/if}
      <button
        class="btn btn-primary"
        on:click={() => {
          if ($options)
            $options = [...$options, { answer: "", extraPrice: null }];
          else $options = [{ answer: "", extraPrice: null }];
        }}
      >
        Lägg till svarsalternativ</button
      >
    </Labeled>
  {/if}
</div>
