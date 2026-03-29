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

<ToggleGroup.Root
  type="single"
  variant="default"
  spacing={3}
  size="lg"
  bind:value={currentValue}
  onValueChange={(value) => {
    if (value === "") return;

    setFilter(value as Exclude<Value, "">);
  }}
  class={className}
>
  <div
    class="not-sx-calendar:mx-1.5 not-sx-calendar:my-1.5 not-sx-calendar:w-full sx-calendar:gap-3 relative flex"
  >
    <div
      class="ring-primary/30 bg-muted not-sx-calendar:rounded-md sx-calendar:w-[calc(50%-0.375rem)] absolute top-0 left-0 h-full w-1/2 rounded-full ring"
      style={`transform: translateX(${x.current}%);`}
    ></div>

    {#each options as option (option.value)}
      <ToggleGroup.Item
        class="text-muted-foreground data-[state=on]:text-foreground not-sx-calendar:w-1/2 not-sx-calendar:rounded-sm relative z-10 p-4 data-[state=on]:bg-transparent"
        value={option.value}
      >
        {option.label}
      </ToggleGroup.Item>
    {/each}
  </div>
</ToggleGroup.Root>
