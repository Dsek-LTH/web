<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { X } from "@lucide/svelte";
  import {
    bgColoursModal,
    shadowColoursModal,
    type CalendarStatusCategory,
  } from "../../config";

  const { title, calendarId }: { title: string; calendarId?: string } =
    $props();

  const status = $derived((calendarId ?? "pending") as CalendarStatusCategory);
  const bgColour = $derived(bgColoursModal[status]);
  const shadow = $derived(shadowColoursModal[status]);
</script>

<div class="mb-6 flex items-start justify-between">
  <div class="flex items-center gap-2 pt-1">
    <div class={`h-3 w-3 rounded-[3px] ${bgColour} ${shadow}`}></div>
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
