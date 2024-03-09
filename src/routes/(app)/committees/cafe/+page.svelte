<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import PositionGrid from "../PositionGrid.svelte";
  import EditCommitteeForm from "../EditCommitteeForm.svelte";
  import CommitteeHeader from "../CommitteeHeader.svelte";
  import { enhance } from "$app/forms";

  import type { PageData } from "./$types";
  import Pagination from "$lib/components/Pagination.svelte";
  export let data: PageData;
  let isEditing = false;

  const getWeekdayName = (weekday: number): string => {
    let date = new Date();
    // we assign monday to 0, not sunday
    while (date.getDay() - 1 !== weekday) {
      date.setDate(date.getDate() + 1);
    }
    return date.toLocaleString("sv-SE", {
      weekday: "long",
    });
  };

  const thisYear = new Date().getFullYear();
</script>

<CommitteeHeader
  committee={data.committee}
  uniqueMemberCount={data.uniqueMemberCount}
  numberOfMandates={data.numberOfMandates}
  editing={isEditing}
  toggleEditing={() => (isEditing = !isEditing)}
/>

<EditCommitteeForm form={data.form} open={isEditing} />

<div class="mb-4 flex flex-wrap items-start justify-between gap-4">
  {#if data.markdown?.markdown}
    <MarkdownBody body={data.markdown.markdown} />
  {/if}

  <div
    class="card flex-1 border border-primary bg-base-100 p-6 shadow-xl lg:max-w-96"
  >
    <h2 class="mb-2 p-2 font-bold lg:text-xl">
      Öppettider
      <span class="block text-sm font-light text-base-content text-opacity-40"
        >Caféet</span
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
          <p class="flex-1 capitalize">{weekday}</p>
          {#if isEditing}
            <form
              class="flex gap-4"
              action="?/update"
              method="POST"
              use:enhance
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
                placeholder={openingHour.markdown}
                size="8"
              />
              <button
                class="btn btn-outline btn-primary btn-sm h-auto"
                type="submit"
              >
                <span class="i-mdi-content-save text-base" />
              </button>
            </form>
          {:else}
            {openingHour.markdown}
          {/if}
        </li>
      {/each}
    </ol>
  </div>
</div>

<Pagination
  count={thisYear - 1982 + 1}
  getPageName={(i) => (thisYear - i).toString()}
  getPageNumber={(page) => thisYear - parseInt(page)}
  fieldName="year"
  showFirst={true}
  class="my-4"
  keepScrollPosition={true}
/>

<PositionGrid positions={data.positions} />
