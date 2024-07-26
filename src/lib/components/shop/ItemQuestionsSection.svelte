<script lang="ts">
  import ItemQuestion from "$lib/components/shop/ItemQuestion.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import { arrayProxy, type SuperForm } from "sveltekit-superforms/client";

  export let superform: SuperForm<TicketSchema>;
  const { values, errors } = arrayProxy(superform, "questions");
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- We only need index -->
{#each $values as _, index}
  <ItemQuestion {superform} field="questions[{index}]" />
{/each}

{#if $errors}
  {#each $errors as error}
    <div class="label">
      <span class="label-text-alt text-error">
        {error}
      </span>
    </div>
  {/each}
{/if}
