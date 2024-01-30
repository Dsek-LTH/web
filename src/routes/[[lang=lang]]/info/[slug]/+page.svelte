<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
</script>

<div class="flex flex-col items-center p-2 text-neutral-content">
  {#if data && data.accessPolicies.includes(`markdowns:${data.slug}:update`)}
    <a type="button" class="btn my-4" href="{data.slug}/edit">Edit</a>
  {/if}

  <MarkdownBody body={data.markdown?.markdown} />
</div>
