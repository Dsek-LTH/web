<script lang="ts">
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import type { SuperForm } from "sveltekit-superforms/client";

  export let superform: SuperForm<TicketSchema>;
</script>

<FormNumberInput
  {superform}
  field="maxAmountPerUser"
  label="Max antal biljetter per person"
/>
