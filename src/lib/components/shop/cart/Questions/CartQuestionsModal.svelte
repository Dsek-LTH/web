<script lang="ts">
  import { run } from "svelte/legacy";

  import Modal from "$lib/components/Modal.svelte";
  import Price from "$lib/components/Price.svelte";
  import type { CartItem } from "$lib/utils/shop/types";
  import ExpiresAtTimer from "../ExpiresAtTimer.svelte";
  import QuestionForm from "./QuestionForm.svelte";
  type Question = CartItem["shoppable"]["questions"][number] & {
    expiresAt: Date | null;
  };

  let selectedQuestion: Question | null = $state(null);
  interface Props {
    allQuestions: Question[];
    // export let responses: CartItem["questionResponses"];
    inspectedItem?: CartItem | null;
    onClose: () => void;
    open?: boolean;
  }

  let {
    allQuestions,
    inspectedItem = null,
    onClose,
    open = $bindable(!!currentQuestion || !!inspectedItem),
  }: Props = $props();
  let questionInNeedOfAnswer = $derived(
    allQuestions.find((question) => question.form?.valid === false),
  );
  let currentQuestion = $derived(questionInNeedOfAnswer ?? selectedQuestion);
  run(() => {
    if (!!currentQuestion || !!inspectedItem) open = true;
    else open = false;
  });
</script>

<Modal
  show={!!currentQuestion || !!inspectedItem}
  backdrop={!!inspectedItem && !currentQuestion}
  {onClose}
>
  {#if !!currentQuestion}
    <QuestionForm
      question={currentQuestion}
      onSuccess={selectedQuestion ? () => (selectedQuestion = null) : undefined}
    />
  {:else if !!inspectedItem}
    <div class="mb-4 flex justify-between">
      <h1 class="text-2xl font-bold">
        Dina svar
        <span class="font-normal"
          ><ExpiresAtTimer expiresAt={inspectedItem.expiresAt} /></span
        >
      </h1>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-lg"
        onclick={onClose}
      >
        <span class="i-mdi-close"></span>
      </button>
    </div>
    <ul class="divide-y-[1px] divide-base-content/20">
      {#each inspectedItem.shoppable.questions as question}
        {@const response = inspectedItem.questionResponses.find(
          (r) => r.questionId === question.id,
        )}
        <li class="py-4 first:pt-0 last:pb-0">
          <h2 class="block text-lg font-semibold">{question.title}</h2>
          <span class="ml-1">
            {response?.answer ?? "Ej besvarad"}
            {#if response?.extraPrice}
              (<Price price={response.extraPrice}>
                {#snippet prefix()}
                  <span>+</span>
                {/snippet}
              </Price>)
            {/if}
          </span>
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            class="btn btn-square btn-sm ml-2 inline-block"
            onclick={() =>
              (selectedQuestion = {
                ...question,
                expiresAt: inspectedItem.expiresAt,
              })}
          >
            <span class="i-mdi-edit"></span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  <p class="mt-4 text-sm opacity-50">
    Du behöver inte stressa.<br /> Din biljett är reserverad.
  </p>
</Modal>
