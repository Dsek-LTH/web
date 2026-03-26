<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { X } from "@lucide/svelte";

  const { title }: { title: string } = $props();
</script>

<!-- TODO: Change colour based on category -->
<div class="mb-6 flex items-start justify-between">
  <div class="flex items-center gap-2 pt-1">
    <div
      class="bg-primary h-3 w-3 rounded-[3px] shadow-[0_0_4px_var(--primary)]"
    ></div>
    <span
      class="-mt-[1px] text-lg leading-none font-black tracking-tight uppercase"
    >
      {title}
    </span>
  </div>

  <Button
    variant="ghost"
    class="size-fit p-0 has-[>svg]:px-0"
    onclick={() => document.body.click()}
  >
    <X class="size-5" />
  </Button>
</div>
