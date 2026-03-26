<script lang="ts">
  import BookingsCalendar from "./calendar/BookingsCalendar.svelte";
  import { BellRing, Info, KeyRound } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { mode, setMode } from "mode-watcher";
  import StatusItem from "./components/StatusItem.svelte";
  import Filter from "./components/Filter.svelte";
  import InfoItem from "./components/InfoItem.svelte";

  // TODO: Pass actual categories from server
  const defaultCategory = { value: "all", label: "all categories" };
  let currentCategory = $state(defaultCategory.value);
</script>

<!-- TODO: Remove -->
<Button
  class="sx-calendar:block hidden"
  onclick={() => setMode(mode.current === "dark" ? "light" : "dark")}
  >SWITCH MODE/THEME</Button
>

<!-- TODO: Read actual data -->
<div
  class="sx-calendar:gap-6 sx-calendar:mt-10 mx-auto mt-6 mb-6 flex w-[var(--sx-calendar-width)] max-w-[var(--sx-calendar-max-width)] flex-col gap-5"
>
  <div class="flex w-full items-end justify-between">
    <div class="sx-calendar:gap-3 flex flex-col gap-2.5">
      <span
        class="text-foreground sx-calendar:text-6xl sx-calendar:-ml-1 sx-calendar:tracking-tighter -ml-0.5 text-5xl leading-none font-semibold tracking-tight uppercase"
      >
        Bookings
        <span class="text-primary italic">Dashboard</span>
      </span>
      <span
        class="text-muted-foreground sx-calendar:text-lg max-w-lg text-base leading-tight font-light"
      >
        Någon kort introducerande text om bokningar etc. etc. etc. etc. etc.
        etc. etc. etc. etc. etc. etc. etc. etc. etc. etc.
      </span>
    </div>

    <div class="sx-calendar:flex hidden gap-3.5">
      <StatusItem mode="desktop" variant="accepted" count={4} />
      <StatusItem mode="desktop" variant="pending" count={2} />
      <StatusItem mode="desktop" variant="rejected" count={0} />
    </div>
  </div>

  <Filter bind:currentCategory />

  <div class="sx-calendar:hidden flex justify-between gap-3">
    <StatusItem mode="mobile" variant="accepted" count={4} />
    <StatusItem mode="mobile" variant="pending" count={2} />
    <StatusItem mode="mobile" variant="rejected" count={0} />
  </div>

  <BookingsCalendar />

  <div class="not-sx-calendar:flex-col flex w-full justify-between gap-4">
    <InfoItem
      Icon={Info}
      title="Viktig allmän info kanske?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afdjhasf kajkfh has fkhaksjf hf kahs fkjhajs"
    />
    <InfoItem
      Icon={KeyRound}
      title="Info om nycklar?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha hakjfhkja fas jfhask fjkash fjkahf jkahf kjhakjf hakjf hajkfh kajhfs jkhfask"
    />
    <InfoItem
      Icon={BellRing}
      title="Info om svar på bokningar?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afag fhag"
    />
  </div>
</div>
