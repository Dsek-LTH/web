<script lang="ts">
  import { Checkbox } from "$lib/components/ui/checkbox/index";
  import { Checkbox as CheckboxPrimitive } from "bits-ui";
  import { Label } from "$lib/components/ui/label/index.js";
  import type { WithoutChildrenOrChild } from "$lib/utils";

  let {
    title,
    description = "",
    ...restProps
  }: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> & {
    title: string;
    description: string;
  } = $props();
</script>

<Label
  class="group hover:bg-accent/50 text-2xs has-[[aria-checked=true]]:border-rosa-background has-[[aria-checked=true]]:bg-rosa-50 dark:has-[[aria-checked=true]]:bg-rosa-950 has-[[aria-checked=true]]:text-rosa-background flex w-full flex-row justify-between rounded-md border p-3"
>
  <div
    class=" flex flex-col justify-center gap-0.5 p-0.5 text-left font-normal"
  >
    <p class="font-sm mt-0 text-sm leading-none">{title}</p>
    <p
      class="text-muted-foreground group-has-[[aria-checked=true]]:text-rosa-background mt-0 text-sm"
    >
      {description}
    </p>
  </div>
  <div class="flex flex-col justify-center">
    <Checkbox
      id="toggle-2"
      checked
      class="data-[state=checked]:bg-rosa-background data-[state=checked]:border-rosa-background dark:data-[state=checked]:text-rosa-950 data-[state=checked]:text-white"
      {...restProps}
    />
  </div>
</Label>
