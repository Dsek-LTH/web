<script lang="ts">
  import EntitySearch from "$lib/components/EntitySearch.svelte";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "./AuthorSignature.svelte";
  let clazz = "";
  export { clazz as class };
  export let isSearching = false;
  export let onSelect: ((member: Member) => void) | undefined;
  export let handleSearch: (searchValue: string) => void;

  const getOption = (option: unknown) => option as Member;
</script>

<EntitySearch
  endpoint="/api/members"
  class={clazz}
  bind:isSearching
  bind:onSelect
  bind:handleSearch
  {...$$restProps}
>
  <slot />
  <div slot="entity" let:option>
    <AuthorSignature links={false} member={getOption(option)} size="md" />
  </div>
</EntitySearch>
