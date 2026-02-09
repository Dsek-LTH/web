<script lang="ts">
  import { Menubar as MenubarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: MenubarPrimitive.TriggerProps = $props();
</script>

<MenubarPrimitive.Trigger
  bind:ref
  data-slot="menubar-trigger"
  class={cn(
    `
		focus:bg-muted-background
		focus:text-accent-foreground
		bg-background
		text-muted-foreground
		data-[state=open]:bg-accent
		data-[state=open]:text-accent-foreground
		flex
		items-center
		gap-2
		rounded-sm
		px-3
		py-1.5
		text-sm
		font-medium
		outline-hidden
		select-none`,
    className,
  )}
  {...restProps}
/>
