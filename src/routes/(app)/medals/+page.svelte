<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import RecipientList from "./RecipientList.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  const thisYear = new Date().getFullYear();
</script>

<PageHeader title="Medaljer" />

<Pagination
  count={thisYear - 1982}
  getPageName={(i) => (thisYear - i).toString()}
  getPageNumber={(page) => thisYear - parseInt(page)}
  fieldName="year"
  showFirst={true}
  class="my-4"
  keepScrollPosition={true}
/>

<RecipientList recipients={data.recipients} />
