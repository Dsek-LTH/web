<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  import { tv } from "tailwind-variants";

  export const navigationMenuTriggerStyle = tv({
    base: "hover:bg-secondary-hover text-muted-foreground hover:text-secondary-foreground focus:bg-secondary-hover focus:text-secondary-foreground data-[state=open]:hover:bg-secondary-hover data-[state=open]:text-secondary-foreground data-[state=open]:focus:bg-secondary-hover data-[state=open]:bg-secondary-hover/50 focus-visible:ring-ring/50 group inline-flex h-9 w-max items-center justify-center rounded-full px-4 py-2 no-underline text-sm font-medium outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
  });
</script>

<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
  bind:ref
  data-slot="navigation-menu-trigger"
  class={cn(navigationMenuTriggerStyle(), "group", className)}
  {...restProps}
>
  {@render children?.()}

  <ChevronDownIcon
    class="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
    aria-hidden="true"
  />
</NavigationMenuPrimitive.Trigger>
