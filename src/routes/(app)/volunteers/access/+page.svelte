<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { CommitteeLoadData } from "../../committees/committee.server";
  import { Other } from "$lib/utils/committee-ordering/enums";
  export let data: CommitteeLoadData & typeof Other;
  const thisYear = new Date().getFullYear();
</script>

<div class="">
  <slot name="before" />
  {#if data.markdown?.markdown}
    <MarkdownBody body={data.markdown.markdown} />
  {/if}
  <slot />
</div>
