<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { RadioGroup as RadioGroupPrimitive } from "bits-ui";

  let { value = $bindable(""), ...restprops }: RadioGroupPrimitive.RootProps =
    $props();
</script>

<RadioGroup.Root bind:value {...restprops}></RadioGroup.Root>
