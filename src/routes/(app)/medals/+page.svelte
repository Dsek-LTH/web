<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import MedalGrid from "./MedalGrid.svelte";
  import { page } from "$app/stores";
  import * as m from "$paraglide/messages";

  import {
    type Semester,
    dateToSemester,
    toString,
    semesterFromYearAndTerm,
    parseSemesterFromString,
  } from "$lib/utils/semesters";

  import type { PageData } from "./$types";
  import { error } from "@sveltejs/kit";
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const firstSemester: Semester = semesterFromYearAndTerm(1982, "HT");
  let currentSemester = $derived(dateToSemester(new Date()));
  let recipients = $derived(data.recipients);
</script>

<SetPageTitle title={m.medals()} />

<div class="space-y-2">
  <Pagination
    count={currentSemester - firstSemester}
    getPageName={(i) => toString(currentSemester - i)}
    getPageNumber={(page) =>
      currentSemester -
      parseSemesterFromString(page, () => {
        throw error(400, "Invalid semester");
      })}
    fieldName="semester"
    showFirst={true}
    showLast={true}
    class="max-w"
  />

  {#if isAuthorized(apiNames.MEDALS.MANAGE, data.user)}
    <a
      class="btn btn-primary"
      href={$page.url.pathname + "/download-csv?" + $page.url.searchParams}
    >
      <span class="i-mdi-file-delimited"></span>CSV
    </a>
  {/if}

  <MedalGrid groups={recipients} />
</div>
