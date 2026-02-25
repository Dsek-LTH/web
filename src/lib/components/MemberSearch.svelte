<script lang="ts">
	import EntitySearch from "$lib/components/EntitySearch.svelte";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	import AuthorSignature from "./socials/AuthorSignature.svelte";
	let clazz = "";
	export { clazz as class };
	export let isSearching = false;
	export let onSelect:
		| ((member: ExtendedPrismaModel<"Member">) => void)
		| undefined;
	export let handleSearch: (searchValue: string) => void;
	export let endpoint = "/api/members";
	export let year: number | undefined = undefined;

	const getOption = (option: unknown) =>
		option as ExtendedPrismaModel<"Member">;
</script>

<EntitySearch
	{endpoint}
	class={clazz}
	bind:isSearching
	bind:onSelect
	bind:handleSearch
	{...$$restProps}
	{year}
>
	<slot />
	<div slot="entity" let:option>
		<AuthorSignature links={false} member={getOption(option)} size="md" />
	</div>
</EntitySearch>
