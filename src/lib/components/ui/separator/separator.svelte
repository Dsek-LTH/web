<script lang="ts">
  import { Separator as SeparatorPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    textClass,
    "data-slot": dataSlot = "separator",
    text,
    ...restProps
  }: SeparatorPrimitive.RootProps & {
    text?: string;
    textClass?: string;
  } = $props();
</script>

{#if text}
  <div class="flex flex-row items-center justify-center gap-4">
    <SeparatorPrimitive.Root
      bind:ref
      data-slot={dataSlot}
      class={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-1/2 data-[orientation=vertical]:h-1/2 data-[orientation=vertical]:w-px",
        className,
      )}
      {...restProps}
    />
    <span class={textClass}>{text}</span>
    <SeparatorPrimitive.Root
      bind:ref
      data-slot={dataSlot}
      class={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-1/2 data-[orientation=vertical]:h-1/2 data-[orientation=vertical]:w-px",
        className,
      )}
      {...restProps}
    />
  </div>
{:else}<SeparatorPrimitive.Root
    bind:ref
    data-slot={dataSlot}
    class={cn(
      "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
      className,
    )}
    {...restProps}
  />{/if}
