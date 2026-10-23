<script lang="ts">
  import { Checkbox } from "$lib/components/ui/checkbox/index";
  import { Checkbox as CheckboxPrimitive } from "bits-ui";
  import { Label } from "$lib/components/ui/label/index.js";
  import type { WithoutChildrenOrChild } from "$lib/utils";
  import { Label as LabelPrimitive } from "bits-ui";
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    title,
    description = "",
    checked = $bindable(false),
    value,
    indeterminate = $bindable(false),
    group = $bindable(),
    class: ClassName,
    ...restProps
  }: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> &
    HTMLInputAttributes &
    LabelPrimitive.RootProps & {
      title: string;
      description?: string;
      value: string;
    } = $props();

  $effect(() => {
    if (group && value) {
      checked = group.includes(value);
    }
  });

  function handleCheckedChange(newChecked: boolean) {
    checked = newChecked;
    if (!group) return;

    if (newChecked) {
      if (!group.includes(value)) {
        group = [...group, value];
      }
    } else {
      group = group.filter((v) => v !== value);
    }
  }
</script>

<Label
  class={[
    "group hover:bg-accent/50 text-2xs has-[[aria-checked=true]]:border-rosa-background has-[[aria-checked=true]]:bg-rosa-50 dark:has-[[aria-checked=true]]:bg-rosa-950 has-[[aria-checked=true]]:text-rosa-background flex w-full cursor-pointer flex-row justify-between rounded-md border p-3",
    ClassName,
  ]}
  onclick={() => handleCheckedChange(!checked)}
>
  <div
    class=" flex flex-col justify-center gap-0.5 p-0.5 text-left font-normal"
  >
    <p class="font-sm mt-0 text-sm leading-none font-semibold">
      {title}
    </p>
    <p
      class="text-muted-foreground group-has-[[aria-checked=true]]:text-rosa-background mt-0 text-sm"
    >
      {description}
    </p>
  </div>
  <div class="flex flex-col justify-center">
    <Checkbox
      bind:checked
      bind:indeterminate
      class="data-[state=checked]:bg-rosa-background data-[state=checked]:border-rosa-background dark:data-[state=checked]:text-rosa-950 data-[state=checked]:text-white"
      {...restProps}
    />
    <input type="checkbox" hidden {value} {checked} bind:group />
  </div>
</Label>
