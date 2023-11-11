<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import type { Tag } from "@prisma/client";
  import type { UpdateSchema } from "./proxy+page.server";
  import { superForm } from "sveltekit-superforms/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { onMount } from "svelte";

  export let data: SuperValidated<UpdateSchema>;
  export let tag: Tag;
  const { form, errors, constraints, enhance, submitting } = superForm(data, {
    id: tag.id,
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
  onMount(() => {
    form.update((f) => {
      f.name = tag.name;
      f.color = tag.color ?? undefined;
      return f;
    });
  });
  let isEditing = false;
</script>

<tr>
  <td
    ><TagChip
      tag={{
        ...tag,
        name: $form.name ?? tag.name,
        color: $form.color ?? tag.color,
      }}
    /></td
  >
  {#if !isEditing}
    <td>{tag.name}</td>
    <td style="color: {tag.color}">{tag.color}</td>
    <td class="text-right">
      <button class="btn btn-xs px-8" type="button" on:click={() => (isEditing = !isEditing)}
        >Edit
      </button>
    </td>
  {:else}
    <td colspan="3">
      <form action="?/update" method="POST" use:enhance class="flex justify-between">
        <input type="hidden" name="id" value={tag.id} {...$constraints.id} />
        {#if $errors.id}<span class="text-error">{$errors.id}</span>{/if}
        <input
          type="text"
          name="name"
          bind:value={$form.name}
          class="input input-bordered input-xs"
          {...$constraints.name}
        />
        {#if $errors.name}<span class="text-error">{$errors.name}</span>{/if}
        <input
          type="text"
          name="color"
          bind:value={$form.color}
          class="input input-bordered input-xs"
          style="color: {$form.color || 'white'}"
          {...$constraints.color}
        />
        {#if $errors.color}<span class="text-error">{$errors.color}</span>{/if}
        <button type="submit" class="btn btn-xs px-8" disabled={$submitting}>
          {#if $submitting}
            <span class="loading loading-xs mx-1"></span>
          {:else}
            Save
          {/if}
        </button>
      </form>
    </td>
  {/if}
</tr>
