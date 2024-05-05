<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { TicketSchema } from "$lib/components/shop/types";

  type Form = SuperForm<UnwrapEffects<TicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];
</script>

<Labeled
  label="Max antal biljetter per person"
  error={$errors.maxAmountPerUser}
>
  <input
    id="maxAmountPerUser"
    name="maxAmountPerUser"
    bind:value={$form.maxAmountPerUser}
    class={"input input-bordered hover:border-base-content"}
    {...$constraints.maxAmountPerUser}
    type="number"
  />
</Labeled>
