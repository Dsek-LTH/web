<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";

  export let data;
  $: committees = [...data.committees].sort((a, b) => a.name.localeCompare(b.name, "sv"));
</script>

<PageHeader title="Utskott" />
<div
  class="grid grid-cols-1 items-stretch justify-items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
>
  {#each committees as committee (committee.id)}
    <a
      href="/committees/{committee.shortName}"
      class="group card bg-base-200 shadow-xl transition-all hover:bg-base-200/80"
    >
      <figure class="px-12 pt-4 transition-transform group-hover:scale-90">
        <img
          src={committee.imageUrl ?? "http://127.0.0.1:9000/material/committees/sigill.svg"}
          alt="Committee icon"
          class="aspect-square"
        />
      </figure>
      <div class="card-body px-0 text-center">
        <h2 class="card-title mx-auto">{committee.name}</h2>
        <h6 class="-mt-2 px-2 text-sm text-base-content/40">
          {[
            ...new Set(
              committee.positions.flatMap((pos) => pos.mandates.map((mandate) => mandate.memberId))
            ),
          ].length} funktionärer
        </h6>
        <p class="px-2">{committee.description ?? ""}</p>
      </div>
    </a>
  {/each}
</div>
