<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import Price from "$lib/components/Price.svelte";
  import { QuestionType, type CartItem } from "$lib/utils/shop/types";
  import { superForm } from "sveltekit-superforms";

  type Question = CartItem["shoppable"]["questions"][number];
  export let question: Question;
  export let onSuccess: (() => void) | undefined = undefined;

  const getSuperForm = (form: Question["form"]) =>
    superForm(form, {
      onResult(event) {
        if (event.result.type === "success") {
          onSuccess?.();
        }
      },
      resetForm: true,
      invalidateAll: "force",
    });
  $: superform = getSuperForm(question.form);
  $: enhance = superform.enhance;
  $: form = superform.form;
</script>

<form use:enhance method="POST" action="?/answerQuestion">
  <h1 class="text-xl font-bold">{question.title}</h1>
  <p class="my-4">{question.description}</p>
  <FormInput type="hidden" {superform} field="questionId" />
  <FormInput type="hidden" {superform} field="consumableId" />
  {#if question.type === QuestionType.MultipleChoice}
    {@const anyHasExtraPrice = question.options.some((o) => !!o.extraPrice)}
    <ul class="menu px-0">
      {#each question.options as option}
        <li class="flex gap-2">
          <label>
            <input
              name="answer"
              class="radio"
              type="radio"
              value={option.answer}
              bind:group={$form.answer}
            />{option.answer}
            {#if anyHasExtraPrice}
              <Price class="text-sm" price={option.extraPrice ?? 0}>
                <span slot="prefix">
                  {#if !!option.extraPrice}+{/if}
                </span>
              </Price>
            {/if}
          </label>
        </li>
      {/each}
    </ul>
  {:else}
    <FormInput {superform} field="answer" />
  {/if}
  <FormSubmitButton
    {superform}
    class="btn btn-primary"
    disabled={!$form.answer}
  >
    Svara
  </FormSubmitButton>
</form>
