<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { languageTag } from "$paraglide/runtime";
  export let data: PageData;
</script>

<PageHeader title={m.openElections()} />
<!-- TODO: make this editable by board members with Markdown page -->
<section class="mb-5 space-y-5">
  <p>
    {m.elections_description()}
  </p>
</section>

<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each data.openElections as election}
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
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
          <a href={election.link}>
            <button class=" btn btn-primary w-full px-9">
              {m.elections_apply()}
            </button>
          </a>
        </div>
      </div>
    </div>
  {/each}
</section>
