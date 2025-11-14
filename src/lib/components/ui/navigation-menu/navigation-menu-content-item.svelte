<script lang="ts">
  const { title, description }: { title: string; description: string } =
    $props();
</script>

<div class="text-secondary-foreground font-medium">{title}</div>
<div class="text-muted-foreground">{description}</div>
