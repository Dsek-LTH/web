<script lang="ts">
  import type { Readme } from "@prisma/client";
  let { issues }: { issues: Readme[] } = $props();
</script>

<div
  class="flex flex-col gap-2 rounded-2xl border-t-4 bg-base-300 p-4 max-lg:border-t-primary max-md:flex-col md:flex-1 lg:border-t-secondary"
>
  <h2 class="text-md flex items-center font-light">
    <!-- TODO: change to /readme one endpoint exists -->
    <a href="/readme" class="text-xl font-bold hover:underline"> Readme </a>
  </h2>
  <ul class="menu flex h-max flex-row justify-between p-0">
    {#each issues as issue (issue.id)}
      <li class="pop-out inline-block w-full">
        <a href={`/readme/${issue.year}/${issue.number}`}>
          <span
            class="i-mdi-newspaper size-6 max-lg:text-primary lg:text-secondary"
          ></span>
          <span class="overflow-hidden text-ellipsis whitespace-nowrap">
            {issue.title}
            ({issue.year}#{issue.number})
          </span>
          <!-- Newer than one week -->
          {#if issue.publishedAt && new Date().getTime() - issue.publishedAt.getTime() < 7 * 24 * 60 * 60 * 1000}
            <div class="badge-soft badge badge-primary lg:badge-secondary">
              new
            </div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</div>
