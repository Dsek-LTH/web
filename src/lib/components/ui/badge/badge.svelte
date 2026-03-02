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

  /**
   * Calculates the relative luminance of a color
   * Based on WCAG 2.0 formula
   */
  function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
  }

  /**
   * Parses a color string (hex, rgb, rgba) and returns RGB values
   */
  function parseColor(
    color: string,
  ): { r: number; g: number; b: number } | null {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0]! + hex[0]!, 16);
        const g = parseInt(hex[1]! + hex[1]!, 16);
        const b = parseInt(hex[2]! + hex[2]!, 16);
        return { r, g, b };
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
    }

    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]!),
        g: parseInt(rgbMatch[2]!),
        b: parseInt(rgbMatch[3]!),
      };
    }

    return null;
  }

  /**
   * Determines whether to use black or white text based on background color
   * Returns 'black' or 'white'
   */
  export function getContrastingTextColor(
    backgroundColor: string,
  ): "black" | "white" {
    const rgb = parseColor(backgroundColor);
    if (!rgb) return "black"; // Default fallback

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5 ? "black" : "white";
  }
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
    color,
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    variant?: BadgeVariant;
    size?: BadgeSize;
    color?: string;
  } = $props();

  const textColor = $derived(
    color ? getContrastingTextColor(color) : undefined,
  );
  const customStyle = $derived(
    color
      ? `background-color: ${color}; color: ${textColor}; border-color: transparent;`
      : undefined,
  );
</script>

<svelte:element
  this={href ? "a" : "span"}
  bind:this={ref}
  data-slot="badge"
  {href}
  class={cn(
    color
      ? "focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3"
      : badgeVariants({ variant, size }),
    className,
  )}
  style={customStyle}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
