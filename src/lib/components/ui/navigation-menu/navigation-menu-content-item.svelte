<script lang="ts">
  import type { Component } from "svelte";

  const {
    title,
    description,
    icon: Icon,
  }: { title: string; description: string; icon?: Component } = $props();
</script>

<div class="flex flex-row items-center gap-2">
  <Icon size="24" class="text-rosa-400" />
  <span class="text-secondary-foreground font-medium">{title}</span>
</div>
<div class="text-muted-foreground">{description}</div>
