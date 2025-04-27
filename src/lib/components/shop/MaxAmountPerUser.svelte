<script lang="ts">
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import { type SuperForm } from "sveltekit-superforms/client";

  interface Props {
    superform: SuperForm<TicketSchema>;
  }

  let { superform }: Props = $props();
</script>

<FormNumberInput
  {superform}
  field="maxAmountPerUser"
  label="Max antal biljetter per person"
/>
