<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import type { WithoutChildrenOrChild } from "$lib/utils";
  import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
  import { Label as LabelPrimitive } from "bits-ui";

  let {
    title,
    description = "",
    class: ClassName,
    ...restProps
  }: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> &
    LabelPrimitive.RootProps & {
      description?: string;
    } = $props();
</script>

<Label
  class={[
    " group text-2xs hover:bg-accent/50 has-[[aria-checked=true]]:border-rosa-background has-[[aria-checked=true]]:bg-rosa-50 dark:has-[[aria-checked=true]]:bg-rosa-950  flex w-full flex-row justify-between rounded-md border p-3",
    ClassName,
  ]}
  {...restProps}
>
  <div
    class=" flex flex-col justify-center gap-0.5 p-0.5 text-left font-normal"
  >
    <p
      class="font-sm group-has-[[aria-checked=true]]:text-rosa-background mt-0 text-sm leading-none"
    >
      {title}
    </p>
    <p
      class="text-muted-foreground group-has-[[aria-checked=true]]:text-rosa-background mt-0 text-sm"
    >
      {description}
    </p>
  </div>
  <RadioGroup.Item
    class="data-[state=checked]:ring-rosa-background data-[state=checked]:accent-rosa-background data-[state=checked]:border-rosa-background"
    {...restProps}
  ></RadioGroup.Item>
</Label>
