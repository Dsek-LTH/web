<script lang="ts" module>
  import { type VariantProps, tv } from "tailwind-variants";

  export const alertVariants = tv({
    base:
      "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border-[1px] px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current " +
      "bg-background border-border [&>svg]:text-current " +
      "dark:bg-[color(from_currentColor_srgb_calc(r-0.6)_calc(g-0.6)_calc(b-0.6))]",
    variants: {
      variant: {
        default: "bg-muted-foreground text-card-foreground",
        error: "text-alert-error-background",
        success: "border-border text-pistachio-400",
        info: "text-alert-info-background",
        warning: "text-alert-warning-background",
        primary: "bg-card dark:bg-card border",
        hidden: "hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: AlertVariant;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert"
  class={cn(alertVariants({ variant }), className)}
  {...restProps}
  role="alert"
>
  {@render children?.()}
</div>
