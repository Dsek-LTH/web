<script lang="ts">
  import EntitySearch from "$lib/components/EntitySearch.svelte";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "./socials/AuthorSignature.svelte";

  interface Props {
    class?: string;
    isSearching?: boolean;
    onSelect: ((member: Member) => void) | undefined;
    handleSearch: (searchValue: string) => void;
    endpoint?: string;
    year?: number | undefined;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    class: clazz = "",
    isSearching = $bindable(false),
    onSelect = $bindable(),
    handleSearch = $bindable(),
    endpoint = "/api/members",
    year = undefined,
    children,
    ...rest
  }: Props = $props();

  const getOption = (option: unknown) => option as Member;
</script>

<EntitySearch
  {endpoint}
  class={clazz}
  bind:isSearching
  bind:onSelect
  bind:handleSearch
  {...rest}
  {year}
>
  {@render children?.()}
  {#snippet entity({ option })}
    <div>
      <AuthorSignature links={false} member={getOption(option)} size="md" />
    </div>
  {/snippet}
</EntitySearch>
