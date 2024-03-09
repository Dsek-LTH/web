<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import PositionGrid from "../PositionGrid.svelte";
  import EditCommitteeForm from "../EditCommitteeForm.svelte";
  import CommitteeHeader from "../CommitteeHeader.svelte";

  import type { PageData } from "./$types";
  import Pagination from "$lib/components/Pagination.svelte";
  export let data: PageData;
  let isEditing = false;
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

{#if data.markdown?.markdown}
  <MarkdownBody body={data.markdown.markdown} />
{/if}

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
