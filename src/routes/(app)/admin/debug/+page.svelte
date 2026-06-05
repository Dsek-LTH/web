<script lang="ts">
  import { page } from "$app/state";
  import { version } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { PageData } from "./$types";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import * as Tooltip from "$lib/components/ui/tooltip/";
  import { Badge } from "$lib/components/ui/badge";

  let { data }: { data: PageData } = $props();
  let user = $derived(data.user);
</script>

<div class="layout-container flex flex-col gap-4">
  {#if isAuthorized("core:admin", page.data.user)}
    <section>
      <h3>Actions</h3>
      <form action="?/meilisearchSync" method="post">
        <Button type="submit">Sync Meilisearch</Button>
        <p>This will update Meilisearch's sync index.</p>
      </form>
    </section>
  {/if}
  <section>
    <h3>MinIO</h3>
    {#if data.minIOHealthy}
      <p>MinIO is healthy.</p>
    {:else}
      <div class="flex flex-row items-center gap-1">
        <CircleAlert />
        MinIO is not healthy, service is probably down.
      </div>
    {/if}
  </section>
  <section>
    <h3>Metadata</h3>
    <ul>
      <li>
        Version:
        <pre class="inline">{version}</pre>
        <Tooltip.Provider
          ><Tooltip.Root>
            <Tooltip.Trigger>
              <Badge variant="outline">?</Badge>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>
                This is guaranteed to match the version of the code that is
                running and is retrieved at build-time. It optionally suffixes
                the tag name with the number of additional commits on top of the
                tagged commit (i.e -2) and the abbreviated hash of the most
                recent commit (i.e -g<hash>).</hash>
              </p>
            </Tooltip.Content>
          </Tooltip.Root></Tooltip.Provider
        >
      </li>
      <li>
        Prisma log level:
        <pre class="inline">{data.prismaLogLevel}</pre>
      </li>
      <li>Is nollning: {data.isNollning}</li>
      <li>
        Is app: {data.isApp}
      </li>
      <li>
        App info: {JSON.stringify(data.appInfo)}
      </li>
    </ul>
  </section>

  <section>
    <h3>Roles</h3>
    <p>User: {user.studentId ?? user.externalCode}</p>
    <ul>
      {#each new Set(user.policies.toSorted()) as policy (policy)}
        <li>{policy}</li>
      {/each}
    </ul>
  </section>
</div>
