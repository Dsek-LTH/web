<script lang="ts">
	import { page } from "$app/stores";
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
	import { isAuthorized } from "$lib/utils/authorization";
	import type { PageData } from "./$types";
	export let data: PageData;
</script>

<SetPageTitle title={$page.params["slug"]} />

<div class="text-neutral-content flex flex-col items-center p-2">
	{#if data && isAuthorized(`markdowns:${data.slug}:update`, data.user)}
		<a type="button" class="btn my-4" href="{data.slug}/edit">Edit</a>
	{/if}

	<MarkdownBody body={data.markdown?.markdown} />
</div>
