<script lang="ts">
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import type { WithElementRef } from "$lib/utils";
  import { onMount } from "svelte";
  import * as m from "$paraglide/messages";
  import type { HTMLBaseAttributes } from "svelte/elements";
  import { Spring } from "svelte/motion";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { setBookingViewFilter } from "$lib/bookings/filters";
  import * as Tabs from "$lib/components/ui/tabs";

  const options = [
    { value: "all", label: m.booking_allBookings() },
    { value: "my", label: m.booking_myBookings() },
  ] as const;
  type Value = (typeof options)[number]["value"] | "";

  let {
    currentValue,
    class: className,
  }: WithElementRef<HTMLBaseAttributes> & {
    currentValue: Value;
  } = $props();

  const x = new Spring(0, { stiffness: 0.4, damping: 0.67, precision: 1 });
  let isSmallScreen = $state(false);

  onMount(() => {
    const checkScreenSize = () =>
      (isSmallScreen = window.matchMedia(
        `(max-width: ${getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-sx-calendar")})`,
      ).matches);

    checkScreenSize();

    window.addEventListener("resize", () => checkScreenSize());
  });

  const setFilter = (filter: "all" | "my") => {
    const url = new URL(page.url);
    setBookingViewFilter(url, filter);

    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the url is correct
    goto(url, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  };

  let oldValue: Value;
  $effect(() => {
    if (currentValue === "") {
      currentValue = oldValue;
    } else {
      oldValue = currentValue;
    }

    x.set(
      (currentValue === options[0].value ? 0 : 1) * (isSmallScreen ? 100 : 111),
    );
  });
</script>

<Tabs.Root
  bind:value={currentValue}
  onValueChange={(value) => {
    if (value === "") return;

    setFilter(value as Exclude<Value, "">);
  }}
  class={className}
>
  <Tabs.List>
    {#each options as option (option.value)}
      <Tabs.Trigger value={option.value}>
        {option.label}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs.Root>
