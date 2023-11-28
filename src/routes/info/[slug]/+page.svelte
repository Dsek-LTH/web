<script lang="ts">
  export let data;
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
</script>

{#if data && data.accessPolicies.includes(`markdowns:${data.slug}:update`)}
  <a type="button" class="btn" href="{data.slug}/edit">Edit</a>
{/if}

<div class="p-2 text-neutral-content">
  <MarkdownBody body={data.markdown?.markdown} />
</div>
