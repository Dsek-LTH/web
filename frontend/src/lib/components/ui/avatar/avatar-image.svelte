<script lang="ts">
  import { Avatar as AvatarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    lazy = false,
    ...restProps
  }: AvatarPrimitive.ImageProps & { lazy?: boolean } = $props();
</script>

<AvatarPrimitive.Image
  bind:ref
  data-slot="avatar-image"
  loading={lazy ? "lazy" : "eager"}
  class={cn(
    "border-secondary-background aspect-square size-full rounded-full border-[1px]",
    className,
  )}
  {...restProps}
/>
