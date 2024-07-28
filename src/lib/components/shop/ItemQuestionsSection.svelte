<script lang="ts">
  import ItemQuestion from "$lib/components/shop/ItemQuestion.svelte";
  import { QuestionType } from "$lib/utils/shop/types";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import { arrayProxy, type SuperForm } from "sveltekit-superforms/client";

  export let superform: SuperForm<TicketSchema>;
  const { values, errors } = arrayProxy(superform, "questions");
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- We only need index -->
{#each $values as _, index}
  <ItemQuestion {superform} field="questions[{index}]" />
{/each}
<button
  type="button"
  on:click={() => {
    $values = [
      ...$values,
      {
        type: QuestionType.Text,
        title: "",
        description: "",
        forExternalsOnly: false,
      },
    ];
  }}
>
  Add question
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
