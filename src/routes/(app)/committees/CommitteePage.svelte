<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import PositionGrid from "./PositionGrid.svelte";
  import EditCommitteeForm from "./EditCommitteeForm.svelte";
  import CommitteeHeader from "./CommitteeHeader.svelte";

  import Pagination from "$lib/components/Pagination.svelte";
  import type { CommitteeLoadData } from "./committee.server";
  import type { page } from "$app/stores";
  interface Props {
    data: CommitteeLoadData & typeof $page.data;
    isEditing?: boolean;
    before?: import("svelte").Snippet;
    children?: import("svelte").Snippet;
  }

  let {
    data,
    isEditing = $bindable(false),
    before,
    children,
  }: Props = $props();
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

<div class="">
  {@render before?.()}
  {#if data.markdown?.markdown}
    <MarkdownBody body={data.markdown.markdown} />
  {/if}
  {@render children?.()}
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
