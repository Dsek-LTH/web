<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils";
  import type { Component, Snippet } from "svelte";
  import type { HTMLBaseAttributes } from "svelte/elements";

  const {
    Icon,
    header,
    description,
    content,
    class: className,
  }: WithElementRef<HTMLBaseAttributes> & {
    Icon: Component;
    header?: string;
    description?: string;
    content?: Snippet;
  } = $props();
</script>

<div class={cn("text-primary flex items-center gap-3", className)}>
  <Icon class="size-4" />
  <div>
    {#if header}
      <p class="text-foreground text-xs font-bold">{header}</p>
    {/if}
    {#if description}
      <p class="text-muted-foreground mt-0.5 font-mono text-[10px]">
        {description}
      </p>
    {/if}
    {@render content?.()}
  </div>
</div>
