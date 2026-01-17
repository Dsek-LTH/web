<script lang="ts">
  import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: NavigationMenuPrimitive.LinkProps = $props();
</script>

<NavigationMenuPrimitive.Link
  bind:ref
  data-slot="navigation-menu-link"
  class={cn(
    "data-[active=true]:focus:bg-secondary-hover data-[active=true]:hover:bg-secondary-hover data-[active=true]:bg-secondary-hover/50 text-muted-foreground data-[active=true]:text-secondary-foreground hover:bg-secondary-hover hover:text-secondary-foreground focus:bg-secondary-hover focus:text-secondary-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded p-2 text-sm no-underline transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
    className,
  )}
  {...restProps}
/>
