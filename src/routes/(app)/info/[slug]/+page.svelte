<script lang="ts">
  import { page } from "$app/state";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<SetPageTitle title={page.params.slug} />

<div class="flex flex-col items-center p-2">
  {#if data && isAuthorized(`markdowns:${data.slug}:update`, data.user)}
    <Button class="btn my-4" href="{data.slug}/edit">Edit</Button>
  {/if}

  <MarkdownBody body={data.markdown?.markdown} />
</div>
