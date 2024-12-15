<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { languageTag } from "$paraglide/runtime";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  export let data: PageData;
</script>

<div class="flex flex-row">
  <PageHeader title={m.openElections()} />
  {#if isAuthorized(apiNames.ELECTION.CREATE, data.user)}
    <a href="/elections/create" class="btn btn-primary ml-auto">+ Nytt val</a>
  {/if}
</div>

<section class="mb-5 space-y-5">
  <p>
    {m.elections_description()}
  </p>
</section>

<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each data.openElections as election}
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        {#if isAuthorized(apiNames.ELECTION.UPDATE, data.user)}
          <a
            href={"/elections/" + election.id + "/edit"}
            class="btn btn-secondary btn-sm ml-auto">Redigera</a
          >
        {/if}
        <img
          class="w-5/12 self-center text-center"
          src={election.committee.darkImageUrl}
          alt="Committee logo"
        />

        <h2 class="card-title self-center text-2xl font-bold">
          {election.committee.name}
        </h2>

        <MarkdownBody body={election.markdown} />
        <p class="text-center font-bold">
          {m.elections_close()}
          {election.expiresAt.toLocaleDateString(languageTag())}
        </p>
        <div class="card-actions self-center">
          <a
            href={election.link}
            target="_blank"
            rel="noreferrer"
            class="btn btn-primary w-full px-9"
          >
            {m.elections_apply()}
          </a>
        </div>
      </div>
    </div>
  {/each}
</section>
