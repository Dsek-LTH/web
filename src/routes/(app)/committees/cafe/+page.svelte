<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";

  import CommitteePage from "../CommitteePage.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
  let isEditing = false;

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

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
</script>

<CommitteePage {data} {isEditing}>
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
    <!-- The bg-zinc here is very ugly, but I couldn't find better fitting colours...-->
    <div
      class="m:2 i-mdi-border-radius:25px relative col-span-2 grid gap-2 rounded-lg border border-primary bg-zinc-300 dark:bg-zinc-800"
    >
      <div class="flex flex-wrap gap-2 p-2">
        <p>{m.booking_week()} 45</p>
      </div>
      <div class="grid grid-cols-1 gap-2 p-2 md:grid-cols-5">
        {#each weekDays as day}
          <div class="m-1 grid rounded bg-base-200 p-2">
            <p class="flex gap-1 font-medium">{day}</p>
            <p class="flex gap-1 font-bold text-primary">Dagis:</p>
            <div
              class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
            >
              field here
            </div>
            <hr class="mb-2 mt-2 border-base-content" />
            <p class="flex gap-1 font-medium">kl 11-12</p>
            <div
              class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
            >
              field here
            </div>
            <div
              class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
            >
              field here
            </div>
            <hr class="mb-2 mt-2 border-base-content" />
            <p class="flex gap-1 font-medium">kl 12-13</p>
            <div
              class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
            >
              field here
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/snippet}
</CommitteePage>
