<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import RecipientList from "./RecipientList.svelte";

  import type { Semester } from "./semesters";
  import {
    dateToSemester,
    toString,
    parseSemester,
    semesterFromYearAndTerm,
  } from "./semesters";

  import type { PageData } from "./$types";
  export let data: PageData;

  const firstSemester: Semester = semesterFromYearAndTerm(1982, "HT");
  const currentSemester = dateToSemester(new Date());
</script>

<PageHeader title="Medaljer" />

<Pagination
  count={currentSemester - firstSemester}
  getPageName={(i) => toString(currentSemester - i)}
  getPageNumber={(page) => currentSemester - parseSemester(page)}
  fieldName="semester"
  showFirst={true}
  showLast={true}
  class="my-4"
/>

<RecipientList recipients={data.recipients} />
