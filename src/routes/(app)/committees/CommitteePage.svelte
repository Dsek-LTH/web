<script lang="ts">
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import PositionGrid from "./PositionGrid.svelte";
	import EditCommitteeForm from "./EditCommitteeForm.svelte";
	import CommitteeHeader from "./CommitteeHeader.svelte";

	import Pagination from "$lib/components/Pagination.svelte";
	import type { CommitteeLoadData } from "./committee.server";
	import type { page } from "$app/stores";
	import SEO from "$lib/seo/SEO.svelte";
	export let data: CommitteeLoadData & typeof $page.data;
	export let isEditing = false;
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

<div class="">
	<slot name="before" />
	{#if data.markdown?.markdown}
		<MarkdownBody body={data.markdown.markdown} />
	{/if}
	<slot />
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
