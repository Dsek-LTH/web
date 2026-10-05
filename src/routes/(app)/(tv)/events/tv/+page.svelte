<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import EventCard from "$lib/components/EventCard.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";

  let { data } = $props();

  const ROTATE_MS = 10_000;
  /** The screen is left open for a long time, so reload now and then to drop events that are over. */
  const REFRESH_MS = 5 * 60_000;

  let current = $state(0);

  // `current` may be out of range after a refresh returned fewer events.
  const active = $derived(
    data.events.length > 0 ? current % data.events.length : 0,
  );

  $effect(() => {
    if (data.events.length <= 1) return;
    const interval = setInterval(() => {
      current = (current + 1) % data.events.length;
    }, ROTATE_MS);
    return () => clearInterval(interval);
  });

  $effect(() => {
    const interval = setInterval(() => invalidateAll(), REFRESH_MS);
    return () => clearInterval(interval);
  });
</script>

<SetPageTitle title={m.events()} />

<div class="bg-background flex min-h-screen items-center justify-center p-8">
  {#if data.events.length === 0}
    <p class="text-muted-foreground text-2xl">{m.events_no_events_found()}</p>
  {:else}
    {#each data.events as event, index (event.id)}
      {#if index === active}
        <div class="w-full max-w-3xl">
          <EventCard {event} {index} />
        </div>
      {/if}
    {/each}
    {#if data.events.length > 1}
      <div
        class="fixed bottom-8 left-1/2 flex w-full max-w-3xl -translate-x-1/2 gap-2 px-8"
      >
        {#each data.events as event, index (event.id)}
          <div class="bg-muted h-1 flex-1 overflow-hidden rounded-full">
            {#if index < active}
              <div class="bg-primary h-full w-full"></div>
            {:else if index === active}
              {#key current}
                <div
                  class="bg-primary h-full w-0"
                  style="animation: tv-progress {ROTATE_MS}ms linear forwards;"
                ></div>
              {/key}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  @keyframes -global-tv-progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
</style>
