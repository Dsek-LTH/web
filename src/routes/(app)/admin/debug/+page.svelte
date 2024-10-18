<script lang="ts">
  import { version } from "$app/environment";
  import { isAuthorized } from "$lib/utils/authorization";

  export let data;
  $: user = data.user;
  $: policies = user.policies.toSorted();
</script>

{#if isAuthorized("core:admin")}
  <section class="mb-4">
    <h1 class="mb-2 text-lg font-semibold">Actions</h1>
    <form action="?/keycloakSync" method="POST" class="flex items-center gap-4">
      <button type="submit" class="btn">Sync with Keycloak</button>
      <p>This will push mandates and pull email addresses.</p>
    </form>
  </section>
{/if}

<section>
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
