<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { RadioGroup as RadioGroupPrimitive } from "bits-ui";

  let { value = $bindable(""), ...restprops }: RadioGroupPrimitive.RootProps =
    $props();
</script>

<RadioGroup.Root bind:value {...restprops}></RadioGroup.Root>
