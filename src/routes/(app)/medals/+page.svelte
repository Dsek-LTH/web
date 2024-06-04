<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import MedalGrid from "./MedalGrid.svelte";
  import { page } from "$app/stores";

  import {
    type Semester,
    dateToSemester,
    toString,
    parseSemester,
    semesterFromYearAndTerm,
  } from "$lib/utils/semesters";

  import type { PageData } from "./$types";
  export let data: PageData;

  const firstSemester: Semester = semesterFromYearAndTerm(1982, "HT");
  $: currentSemester = dateToSemester(new Date());
  $: recipients = data.recipients;
</script>

<PageHeader title="Medaljer" />

<div class="space-y-2">
  <Pagination
    count={currentSemester - firstSemester}
    getPageName={(i) => toString(currentSemester - i)}
    getPageNumber={(page) => currentSemester - parseSemester(page)}
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
