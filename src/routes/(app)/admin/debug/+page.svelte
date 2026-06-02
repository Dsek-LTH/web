<script>
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { isAuthorized } from "$lib/utils/authorization";
</script>

<div class="layout-container">
  {#if isAuthorized("core:admin", page.data.user)}
    <form action="?/meilisearchSync" method="post">
      <Button type="submit">Sync Meilisearch</Button>
    </form>
  {/if}
</div>
