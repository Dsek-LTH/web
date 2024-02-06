<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<div class="flex flex-col items-center p-2 text-neutral-content">
  {#if data && isAuthorized(`markdowns:${data.slug}:update`, data.user)}
    <a type="button" class="btn my-4" href="{data.slug}/edit">Edit</a>
  {/if}

  <MarkdownBody body={data.markdown?.markdown} />
</div>
