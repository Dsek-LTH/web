<script lang="ts">
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { CreateTicketSchema } from "./+page.server";
  import Labeled from "$lib/components/Labeled.svelte";
  import DateInput from "$lib/components/DateInput.svelte";

  type Form = SuperForm<UnwrapEffects<CreateTicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];
</script>

<div
  class="flex flex-col justify-between gap-4 md:flex-row md:items-end [&>*]:flex-1"
>
  <Labeled label="Tillgång från" error={$errors.availableFrom}>
    <DateInput
      bind:date={$form.availableFrom}
      name="availableFrom"
      {...$constraints.availableFrom}
    />
  </Labeled>

  {#if $form.availableTo != undefined}
    <Labeled label="Tillgänglig till" error={$errors.availableTo}>
      <DateInput
        bind:date={$form.availableTo}
        name="availableTo"
        {...$constraints.availableTo}
      />
    </Labeled>
    <button
      type="button"
      class="btn"
      on:click={() => ($form.availableTo = undefined)}
    >
      Ta bort sluttid
    </button>
  {:else}
    <button
      type="button"
      class="btn"
      on:click={() => ($form.availableTo = $form.availableFrom)}
    >
      <span class="i-mdi-plus text-xl" />
      Lägg till sluttid
    </button>
  {/if}
</div>
