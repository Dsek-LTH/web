<script lang="ts">
  import CommitteeIcon from "$lib/components/CommitteeIcon.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
  $: committees = [...data.committees].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );
</script>

<PageHeader title={m.committees_committees()} />
<div
  class="grid grid-cols-1 items-stretch justify-items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
>
  {#each committees as committee (committee.id)}
    <a
      href="/committees/{committee.shortName}"
      class="group card bg-base-300 shadow-xl transition-all hover:bg-base-200/80"
    >
      <figure
        class="max-h-24 px-12 pt-4 transition-transform *:max-h-full group-hover:scale-90 md:max-h-48"
      >
        <CommitteeIcon imageUrl={committee.imageUrl} />
      </figure>
      <div class="card-body px-0 text-center">
        <h2 class="card-title mx-auto">{committee.name}</h2>
        <h6 class="-mt-2 px-2 text-sm text-base-content/40">
          {[
            ...new Set(
              committee.positions.flatMap((pos) =>
                pos.mandates.map((mandate) => mandate.memberId),
              ),
            ),
          ].length}
          {m.committees_volunteers()}
        </h6>
        <p class="px-2">{committee.description ?? ""}</p>
      </div>
    </a>
  {/each}
</div>
