<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { CreateTicketSchema } from "./+page.server";

  type Form = SuperForm<UnwrapEffects<CreateTicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];

  $: isActive = $form.maxAmountPerUser !== undefined;
</script>

<Labeled
  label="Max antal biljetter per person"
  id="maxAmountPerUser"
  error={$errors.maxAmountPerUser}
>
  {#if isActive}
    <div class="flex items-end gap-4 [&>*:first-child]:flex-1">
      <input
        id="maxAmountPerUser"
        name="maxAmountPerUser"
        bind:value={$form.maxAmountPerUser}
        class={"input input-bordered hover:border-base-content"}
        {...$constraints.maxAmountPerUser}
        type="number"
      />
      <button
        class="btn"
        type="button"
        on:click={() => ($form.maxAmountPerUser = undefined)}
      >
        Ta bort max antal
      </button>
    </div>
  {:else}
    <button
      class="btn"
      type="button"
      on:click={() => ($form.maxAmountPerUser = 1)}
    >
      Lägg till max antal biljetter per person
    </button>
  {/if}
</Labeled>
