<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { CreateTicketSchema } from "./+page.server";

  type Form = SuperForm<UnwrapEffects<CreateTicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];
</script>

<Labeled label="Biljettpris (SEK)" error={$errors.price}>
  <input
    name="price"
    bind:value={$form.price}
    class="input input-bordered min-w-0 shrink"
    {...$constraints.price}
    step="0.01"
    type="number"
  />
</Labeled>
