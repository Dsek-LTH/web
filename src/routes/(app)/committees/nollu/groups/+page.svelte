<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import PhadderGroupForm from "./PhadderGroupForm.svelte";
  import EditableGroup from "./EditableGroup.svelte";

  let { data } = $props();
  let groupsByYear = $derived(
    data.groups.reduce(
      (acc, group) => {
        if (!acc[group.year]) {
          acc[group.year] = [];
        }
        acc[group.year]!.push(group);
        return acc;
      },
      {} as Record<number, typeof data.groups>,
    ),
  );
  let years = $derived(
    Object.keys(groupsByYear)
      .map(Number)
      .sort((a, b) => b - a),
  );

  let addingGroup = $state(false);
</script>

<PageHeader title="Phaddergrupper" />

<div class="space-y-4">
  {#if addingGroup}
    <div class="-mx-4 rounded-box bg-base-200 p-4">
      <PhadderGroupForm form={data.form} create>
        {#snippet start()}
          <button
            class="btn self-start"
            type="button"
            onclick={() => (addingGroup = false)}>Avbryt</button
          >
        {/snippet}
      </PhadderGroupForm>
    </div>
  {:else}
    <button
      class="btn mt-4 self-start"
      type="button"
      onclick={() => (addingGroup = true)}>Lägg till grupp</button
    >
  {/if}
  {#each years as year}
    {@const groups = groupsByYear[year] ?? []}
    {#if groups.length > 0}
      <section class="rounded-box bg-base-200 p-4" id={year.toString()}>
        <h3 class="mb-4 text-xl font-medium">{year}</h3>
        <ul class="grid gap-2 md:grid-cols-2">
          {#each groups as group (group.id)}
            <EditableGroup {group} />
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
</div>
