<script lang="ts">
  import MemberCard from "$lib/components/MemberCard.svelte";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";

  let {
    data,
    class: clazz,
  }: { data: MemberSearchReturnAttributes; class?: string } = $props();
</script>

<div data-search-result class={clazz}>
  <MemberCard member={data} links={false} class="rounded-xl p-1 pr-3" />
</div>
