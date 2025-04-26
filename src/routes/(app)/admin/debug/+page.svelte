<script lang="ts">
  import { version } from "$app/environment";
  import { page } from "$app/state";
  import { isAuthorized } from "$lib/utils/authorization";
  import {
    featureFlags,
    isFeatureFlagEnabled,
    setFeatureFlag,
  } from "$lib/utils/featureFlag";
  import { onMount } from "svelte";

  let { data } = $props();
  let user = $derived(data.user);
  let policies = $derived(user.policies.toSorted());
  let flags = $derived(new Map<string, boolean>());
  onMount(() => {
    const flagMap = new Map<string, boolean>();
    featureFlags.forEach((f) => {
      flagMap.set(f, isFeatureFlagEnabled(f));
      flags = flagMap;
    });
  });
</script>

<div class="flex flex-row gap-10">
  <div>
    {#if isAuthorized("core:admin", page.data.user)}
      <section class="mb-4 space-y-2">
        <h1 class="text-lg font-semibold">Actions</h1>
        <form
          action="?/keycloakSync"
          method="POST"
          class="flex items-center gap-4"
        >
          <button type="submit" class="btn">Sync with Keycloak</button>
          <p>This will push mandates and pull email addresses.</p>
        </form>
        <form
          action="?/meilisearchSync"
          method="POST"
          class="flex items-center gap-4"
        >
          <button type="submit" class="btn">Sync with Meilisearch</button>
          <p>This will update Meilisearch's sync index.</p>
        </form>
      </section>
    {/if}

    <section>
      <h1 class="text-lg font-semibold">MinIO</h1>
      {#if data.minIOHealthy}
        <p>MinIO is healthy.</p>
      {:else}
        <div class="alert alert-error">
          <span class="i-mdi-alert-circle"></span>
          {"MinIO is not healthy, service is probably down."}
        </div>
      {/if}
      <h1 class="text-lg font-semibold">Metadata</h1>
      <ul class="ml-4 list-disc">
        <li>
          Version:
          <pre class="inline">{version}</pre>
          <span
            class="badge badge-neutral tooltip tooltip-bottom aspect-square px-1"
            data-tip="This is guaranteed to match the version of the code that is running and is retrieved at build-time. It optionally suffixes the tag name with the number of additional commits on top of the tagged commit (i.e -2) and the abbreviated hash of the most recent commit (i.e -g<hash>)."
          >
            ?
          </span>
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

    <section class="mt-4">
      <h1 class="text-lg font-semibold">
        User: {user.studentId ?? user.externalCode}
      </h1>
      <ul class="ml-4 list-disc text-sm">
        {#each policies as permission}
          <li>{permission}</li>
        {/each}
      </ul>
    </section>
  </div>
  <div>
    <section>
      <h1 class="text-lg font-semibold">Feature flags</h1>
      {#each featureFlags as flag}
        <div class="flex gap-5">
          {flag}
          <input
            type="checkbox"
            class="toggle toggle-primary"
            checked={flags.get(flag)}
            onchange={() => {
              setFeatureFlag(flag, isFeatureFlagEnabled(flag) ? false : true);
            }}
          />
        </div>
      {/each}
    </section>
  </div>
</div>
