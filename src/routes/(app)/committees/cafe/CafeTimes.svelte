<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import * as Card from "$lib/components/ui/card";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  /*const getWeekdayName = (weekday: number): string => {
    let date = dayjs();
    // we assign monday to 0, not sunday
    while (date.day() - 1 !== weekday) {
      date = date + 1;
    }
    return date.toLocaleString(languageTag(), {
      weekday: "long",
    });
  };
  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  let week = $derived(
    dayjs()
      .startOf("year")
      .add(data.week - 1, "week"),
  );*/
</script>

<Card.Root>
  <Card.Content>
    <h3>
      {m.committees_cafe_openinghours()}
    </h3>
    <span class="">{m.committees_cafe_thecafe()}</span>
    <ol>
      {#each data.openingHours as openingHour, i (openingHour)}
        {@const weekday = "Måndag"}

        {@const isToday = new Date().getDay() - 1 === i}
        <li
          class="bg-opacity-10 flex gap-4 p-2"
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
                name="markdownSv"
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
  </Card.Content>
</Card.Root>
