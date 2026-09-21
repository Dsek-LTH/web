<script lang="ts">
  import * as m from "$paraglide/messages";
  import Vote from "@lucide/svelte/icons/vote";
  import Landmark from "@lucide/svelte/icons/landmark";
  import Users from "@lucide/svelte/icons/users";
  import Hammer from "@lucide/svelte/icons/hammer";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";

  // Top-down flow of who decides what. Purely presentational.
  const levels = [
    {
      title: m.volunteer_about_map_meeting_title,
      desc: m.volunteer_about_map_meeting_desc,
      icon: Vote,
      edge: m.volunteer_about_map_edge_elects,
    },
    {
      title: m.volunteer_about_map_board_title,
      desc: m.volunteer_about_map_board_desc,
      icon: Landmark,
      edge: m.volunteer_about_map_edge_appoints,
    },
    {
      title: m.volunteer_about_map_committees_title,
      desc: m.volunteer_about_map_committees_desc,
      icon: Users,
      edge: m.volunteer_about_map_edge_consists,
    },
    {
      title: m.volunteer_about_map_functionaries_title,
      desc: m.volunteer_about_map_functionaries_desc,
      icon: Hammer,
      edge: null,
    },
  ] as const;
</script>

<ol
  class="flex flex-col items-stretch gap-3 xl:flex-row xl:items-stretch xl:gap-0"
>
  {#each levels as level, index (level.title)}
    <li
      class="animate-in fade-in slide-in-from-bottom-[0.5rem] fill-mode-backwards flex flex-1 flex-col duration-300"
      style="animation-delay:{index * 80}ms"
    >
      <div
        class="border-border/80 bg-card flex h-full flex-col gap-3 rounded-xl border p-6 shadow-xs"
      >
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 text-primary shrink-0 rounded-lg p-2.5">
            <level.icon class="size-5" />
          </div>
          <h4 class="text-base leading-tight font-semibold">{level.title()}</h4>
        </div>
        <p class="text-muted-foreground text-base leading-relaxed">
          {level.desc()}
        </p>
      </div>
    </li>

    {#if level.edge}
      <li
        class="text-primary flex shrink-0 items-center justify-center gap-1.5 xl:w-24 xl:flex-col xl:gap-1"
        aria-hidden="true"
      >
        <ChevronDown class="size-5 xl:hidden" />
        <ChevronRight class="hidden size-5 xl:block" />
        <span
          class="text-xs font-semibold tracking-wide uppercase xl:text-center"
        >
          {level.edge()}
        </span>
      </li>
    {/if}
  {/each}
</ol>
