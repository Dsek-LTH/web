<script lang="ts" module>
  import { type VariantProps, tv } from "tailwind-variants";

  export const badgeVariants = tv({
    base: "px-2 py-0.5 gap-1 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border  font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
    variants: {
      variant: {
        rosa: "bg-rosa-400 text-rosa-foreground [a&]:hover:bg-rosa-hover border-transparent",
        lila: "bg-lila-600 text-lila-foreground [a&]:hover:bg-lila-hover border-transparent",
        pistachio:
          "bg-pistachio-400 text-pistachio-foreground [a&]:hover:bg-pistachio-hover border-transparent",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      size: {
        default: "text-xs",
        lg: "text-xl",
      },
    },
    defaultVariants: {
      variant: "rosa",
      size: "default",
    },
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
  export type BadgeSize = VariantProps<typeof badgeVariants>["size"];
  export const getBadgeVariantFromProgramme = (
    programmme: "D" | "C" | "VR/AR" | string | null,
  ): BadgeVariant => {
    switch (programmme) {
      case "D":
        return "rosa";
      case "C":
        return "lila";
      case "VR/AR":
        return "pistachio";
      default:
        return "outline";
    }
  };
</script>

<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    href,
    class: className,
    variant = "rosa",
    size = "default",
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    variant?: BadgeVariant;
    size?: BadgeSize;
  } = $props();
</script>

<svelte:element
  this={href ? "a" : "span"}
  bind:this={ref}
  data-slot="badge"
  {href}
  class={cn(badgeVariants({ variant, size }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
