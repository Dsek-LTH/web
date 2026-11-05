<script lang="ts">
  import * as Item from "$lib/components/ui/item";
  import type { Component } from "svelte";

  const {
    Icon,
    title,
    description,
  }: { Icon: Component; title: string; description: string } = $props();
</script>

<Item.Root variant="muted">
  <div class="flex h-full flex-col items-start justify-start gap-6 px-2 py-1.5">
    <Item.Media>
      <Icon class="text-primary size-6"></Icon>
    </Item.Media>
    <Item.Content class="mb-auto">
      <Item.Title class="text-base">{title}</Item.Title>
      <Item.Description class="line-clamp-none">{description}</Item.Description>
    </Item.Content>
  </div>
</Item.Root>
