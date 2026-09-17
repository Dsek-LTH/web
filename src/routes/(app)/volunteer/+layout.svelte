<script lang="ts">
  import { page } from "$app/state";
  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { resolve } from "$app/paths";

  const { children } = $props();

  const steps = [
    { path: "/(app)/volunteer", label: m.volunteer_nav_overview },
    { path: "/(app)/volunteer/get-informed", label: m.volunteer_nav_informed },
    { path: "/(app)/volunteer/about-guild", label: m.volunteer_nav_about },
    {
      path: "/(app)/volunteer/involvement",
      label: m.volunteer_nav_involvement,
    },
    { path: "/(app)/volunteer/apply", label: m.volunteer_nav_apply },
    { path: "/(app)/volunteer/meetings", label: m.volunteer_nav_meetings },
  ] as const;

  let currentPath = $derived(page.url.pathname.replace(/\/$/, "")); // Normalize trailing slashes
  let currentIndex = $derived(
    steps.findIndex((step) => resolve(step.path) === currentPath),
  );

  let prevStep = $derived(currentIndex > 0 ? steps[currentIndex - 1] : null);
  let nextStep = $derived(
    currentIndex >= 0 && currentIndex < steps.length - 1
      ? steps[currentIndex + 1]
      : null,
  );
</script>

<SetPageTitle title={m.volunteer_landing_title()} />

<div class="layout-container flex flex-col gap-8 md:flex-row md:items-start">
  <!-- Desktop Sidebar Navigation / Mobile Scrollable Tab Navigation -->
  <aside class="w-full shrink-0 md:sticky md:top-24 md:w-64">
    <nav
      class="scrollbar-none flex flex-row gap-2 overflow-x-auto pb-4 md:flex-col md:overflow-x-visible md:pb-0"
    >
      {#each steps as step (step.path)}
        {@const isActive = currentPath === resolve(step.path)}
        <Button
          href={resolve(step.path)}
          variant={isActive ? "rosa" : "ghost"}
          aria-current={isActive ? "page" : undefined}
          class="shrink-0 justify-start text-left md:w-full {isActive
            ? 'bg-primary font-semibold text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          {step.label()}
        </Button>
      {/each}
    </nav>
  </aside>

  <!-- Page Content Shell -->
  <div class="flex min-w-0 flex-1 flex-col gap-10">
    <div class="w-full">
      {@render children?.()}
    </div>

    <!-- Navigation Footer -->
    {#if currentIndex >= 0}
      <div class="border-border border-t pt-6">
        <div class="flex flex-row items-center justify-between gap-4">
          {#if prevStep}
            <Button
              href={resolve(prevStep.path)}
              variant="outline"
              class="flex items-center gap-2"
            >
              <ChevronLeft class="size-4" />
              <span>{prevStep.label()}</span>
            </Button>
          {:else}
            <div></div>
          {/if}

          {#if nextStep}
            <Button
              href={resolve(nextStep.path)}
              variant="rosa"
              class="bg-primary hover:bg-rosa-hover flex items-center gap-2 text-white shadow-md"
            >
              <span>{nextStep.label()}</span>
              <ChevronRight class="size-4" />
            </Button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
