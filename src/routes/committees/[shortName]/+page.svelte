<script lang="ts">
  import CommitteIcon from "$lib/components/CommitteIcon.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { superForm } from "sveltekit-superforms/client";
  import PositionCard from "./PositionCard.svelte";

  export let data;
  const { form, errors, constraints, enhance, message } = superForm(data.form);
  $: everyOtherPosition = data.positions.filter((_, i) => i % 2 === 0);
  $: everyOtherPosition2 = data.positions.filter((_, i) => i % 2 === 1);
  let isEditing = false;
</script>

<header class="mb-2 flex items-center gap-4">
  <figure class="w-14">
    <CommitteIcon committee={data.committee} />
  </figure>
  <div class="flex-1">
    <div class="flex items-center justify-between">
      <PageHeader title={data.committee.name} />
      {#if data.accessPolicies.includes(apiNames.COMMITTEE.UPDATE) || data.accessPolicies.includes(apiNames.POSITION.CREATE)}
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? "Sluta redigera" : "Redigera"}
        </button>
      {/if}
    </div>
    <h2 class="-mt-4">
      {data.uniqueMemberCount} funktionärer, {data.numberOfMandates} olika mandat
    </h2>
  </div>
</header>
{#if data.committee.description}
  <p class="mb-4">{data.committee.description}</p>
{/if}

<!-- Edit committee form -->
{#if isEditing && data.accessPolicies.includes(apiNames.COMMITTEE.UPDATE)}
  <form
    action="?/update"
    method="POST"
    use:enhance
    class="form-control"
    enctype="multipart/form-data"
  >
    <Input label="Namn" name="name" value={$form.name} {...$constraints.name} />
    {#if $errors.name}
      <p class="text-error">{$errors.name}</p>
    {/if}
    <Labeled label="Beskrivning" id="description">
      <textarea
        name="description"
        id="description"
        class="textarea textarea-bordered"
        rows="3"
        value={$form.description}
        {...$constraints.description}
      />
    </Labeled>
    {#if $errors.description}
      <p class="text-error">{$errors.description}</p>
    {/if}
    <Labeled
      label="Utskottsbild"
      id="image"
      explanation="Detta ska vara svg format, utan bakgrundsfärg, utan onödigt whitespace och med vit text."
    >
      <input
        name="image"
        id="image"
        class=" file-input file-input-bordered w-full max-w-xs"
        type="file"
        accept=".svg"
        {...$constraints.image}
      />
    </Labeled>
    {#if $errors.image}
      <p class="text-error">{$errors.image}</p>
    {/if}
    <button type="submit" class="btn btn-secondary my-4">Spara</button>
    {#if $message}
      <p class="text-success">{$message}</p>
    {/if}
  </form>
{/if}

<div class="hidden grid-cols-2 gap-4 md:grid">
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition2 as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
</div>
<div class="grid gap-4 md:hidden">
  {#each data.positions as position (position.id)}
    <PositionCard {position} mandates={position.mandates} />
  {/each}
</div>
