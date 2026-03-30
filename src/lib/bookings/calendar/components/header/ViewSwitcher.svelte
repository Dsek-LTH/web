<script lang="ts">
  import * as Select from "$lib/components/ui/select";

  type View = { name: string; label: string };
  let {
    currentView = $bindable(),
    views,
    defaultView,
  }: {
    currentView: string;
    views: View[];
    defaultView: string;
  } = $props();

  const viewTriggerContent = $derived(
    views.find((view) => view.name === currentView)?.label ?? defaultView,
  );
</script>

{#snippet selectItem(item: View)}
  <Select.Item
    class="data-[selected]:text-primary data-[highlighted]:text-primary text-xs"
    value={item.name}
  >
    {item.label} view
  </Select.Item>
{/snippet}

<Select.Root type="single" bind:value={currentView}>
  <Select.Trigger size="sm" class="mt-0.5 !h-fit rounded-sm border-none p-0">
    <span
      class="text-primary -mr-1 text-xs font-medium tracking-wider uppercase"
    >
      {viewTriggerContent} view
    </span>
  </Select.Trigger>

  <Select.Content class="text-muted-foreground uppercase">
    {#each views as view (view.name)}
      {@render selectItem(view)}
    {/each}
  </Select.Content>
</Select.Root>
