<script lang="ts">
  export let data;
  import { goto } from "$app/navigation";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
</script>

{#if data && data.accessPolicies.includes(`markdowns:${data.slug}:update`)}
  <button
    type="button"
    class="btn"
    on:click={() => {
      goto(`${data.slug}/edit`);
    }}>Edit</button
  >
{/if}

<div class="p-2 text-neutral-content">
  <MarkdownBody body={data.markdown?.markdown} />
</div>
