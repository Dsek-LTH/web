<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import PositionGrid from "./PositionGrid.svelte";
  import EditCommitteeForm from "./EditCommitteeForm.svelte";
  import CommitteeHeader from "./CommitteeHeader.svelte";

  import Pagination from "$lib/components/Pagination.svelte";
  import type { CommitteeLoadData } from "./committee.server";
  import { page } from "$app/state";
  import SEO from "$lib/seo/SEO.svelte";
  import type { Snippet } from "svelte";
  // export let data: CommitteeLoadData & typeof $page.data;
  // export let isEditing = false;
  let {
    data = $bindable(),
    isEditing = $bindable(),
    beforeMarkdown,
    afterMarkdown,
    main,
  }: {
    data: CommitteeLoadData & typeof page.data;
    isEditing: boolean;
    beforeMarkdown?: Snippet;
    afterMarkdown?: Snippet;
    main?: Snippet;
  } = $props();
  const thisYear = new Date().getFullYear();
</script>

<SEO
  data={{
    type: "website",
    props: {
      title: data.committee.name,
      description: data.committee.description,
    },
  }}
  image={{
    url: data.committee.lightImageUrl,
    alt: data.committee.name,
    width: 1500,
    height: 1500,
    mime_type: "image/svg+xml",
  }}
></SEO>
<CommitteeHeader
  committee={data.committee}
  uniqueMemberCount={data.uniqueMemberCount}
  numberOfMandates={data.numberOfMandates}
  editing={isEditing}
  toggleEditing={() => (isEditing = !isEditing)}
/>

<EditCommitteeForm form={data.form} open={isEditing} />

<div class="flex flex-col place-content-start md:flex-row-reverse">
  {@render beforeMarkdown?.()}
  <div>
    {#if data.markdown?.markdown}
      <MarkdownBody body={data.markdown.markdown} />
    {/if}
    {@render afterMarkdown?.()}
  </div>
</div>
<br />
{@render main?.()}

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
