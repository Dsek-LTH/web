<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import dayjs from "dayjs";

  import CommitteePage from "../CommitteePage.svelte";
  import CafeBookingCalendar from "./CafeBookingCalendar.svelte";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  let isEditing = $state(false);

  const getWeekdayName = (weekday: number): string => {
    let date = new Date();
    // we assign monday to 0, not sunday
    while (date.getDay() - 1 !== weekday) {
      date.setDate(date.getDate() + 1);
    }
    return date.toLocaleString(languageTag(), {
      weekday: "long",
    });
  };
  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  const week = dayjs().add(data.weekShift, "week");
  const shifts = $derived(data.shifts);
</script>

<CommitteePage bind:data bind:isEditing>
  {#snippet beforeMarkdown()}
    <div
      class="card mb-5 w-full border border-primary bg-base-100 p-6 shadow-xl md:mb-0 md:ml-20 lg:max-w-80"
    >
      <h2 class="mb-2 p-2 font-bold lg:text-xl">
        {m.committees_cafe_openinghours()}
        <span class="block text-sm font-light text-base-content text-opacity-40"
          >{m.committees_cafe_thecafe()}</span
        >
      </h2>
      <ol>
        {#each data.openingHours as openingHour, i}
          {@const weekday = getWeekdayName(
            Number.parseInt(openingHour.name.split(":").pop() ?? ""),
          )}
          {@const isToday = new Date().getDay() - 1 === i}
          <li
            class="flex gap-4 bg-opacity-10 p-2"
            class:bg-primary={isToday}
            class:font-bold={isToday}
          >
            <p class="flex-1 self-center capitalize">{weekday}</p>
            {#if isEditing}
              <form
                class="flex gap-4"
                action="?/updateHours"
                method="POST"
                use:enhance={() => {
                  return ({ update }) => update({ reset: false });
                }}
              >
                <input
                  hidden
                  type="text"
                  name="markdownSlug"
                  value={openingHour.name}
                />
                <input
                  type="text"
                  class="input input-bordered font-normal"
                  name="markdown"
                  value={openingHour.markdown}
                  size="8"
                />
                <button
                  class="btn btn-outline btn-primary btn-sm h-auto"
                  type="submit"
                  aria-label="submit new cafe opening time"
                >
                  <span class="i-mdi-content-save text-base"></span>
                </button>
              </form>
            {:else}
              {openingHour.markdown}
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  {/snippet}

  {#snippet afterMarkdown()}
    <div>
      <br />
      <hr />
      <br />
      <article>
        <h2 class="text-xl font-bold text-primary">
          {m.cafe_ciabatta()}
        </h2>
        <!-- TODO: Get data from database here -->
        <h2 class="text-xl font-bold">Köttbullar & Falaffel</h2>
      </article>
    </div>
  {/snippet}

  {#snippet main()}
    <CafeBookingCalendar {week} {shifts} />
  {/snippet}
</CommitteePage>
