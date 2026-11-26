<script lang="ts">
  import { Menubar as MenubarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    inset = undefined,
    ...restProps
  }: MenubarPrimitive.ItemProps & {
    inset?: boolean;
  } = $props();
</script>

<MenubarPrimitive.Item
  bind:ref
  data-slot="menubar-item"
  data-inset={inset}
  class={cn(
    `
		focus:bg-muted-background
		focus:text-accent-foreground
		bg-background
		text-muted-foreground
		[&_svg:not([class*='text-'])]:text-muted-foreground
		relative
		flex
		cursor-default
		items-center
		gap-2
		rounded-sm
		px-3
		py-1.5
		text-sm
		outline-hidden
		select-none
		data-[disabled]:pointer-events-none
		data-[disabled]:opacity-50
		data-[inset]:ps-8
		[&_svg]:pointer-events-none
		[&_svg]:shrink-0
		[&_svg:not([class*='size-'])]:size-4`,
    className,
  )}
  {...restProps}
/>
