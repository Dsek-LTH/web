<script lang="ts">
  import type { MeetingAgendaItem, MeetingAttachment } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { UpdateItemSchema } from "./+page.server";
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";
  import Input from "$lib/components/Input.svelte";

  export let isCurrentItem: boolean;
  export let item: MeetingAgendaItem & { attachments: MeetingAttachment[] };
  export let data: SuperValidated<UpdateItemSchema>;
  const { form, constraints, errors, enhance } = superForm(data, {
    id: item.id,
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
  $: (() => {
    $form = { ...item };
  })();
  let formEl: HTMLFormElement;
  $: canEdit = $page.data.accessPolicies.includes(apiNames.MEETINGS.UPDATE);
  let isEditing = false;
</script>

<li class="step" class:step-secondary={isCurrentItem} class:step-primary={$form.concluded}>
  <form method="POST" action="?/updateItem" use:enhance class="w-full" bind:this={formEl}>
    <input type="hidden" name="id" value={item.id} />
    {#if !isEditing}
      <div class="flex w-full max-w-lg justify-between">
        <label for="concluded-{item.id}" class="label" class:cursor-pointer={canEdit}>
          <span class="label-text">{item.title}</span>
        </label>
        {#if canEdit}
          <div class="flex items-center gap-2">
            <input
              id="concluded-{item.id}"
              type="checkbox"
              name="concluded"
              bind:checked={$form.concluded}
              class="checkbox-secondary checkbox"
              on:change={() => {
                formEl.requestSubmit();
              }}
            />
            <button
              type="button"
              class="btn btn-square btn-secondary btn-outline btn-xs"
              on:click={() => {
                isEditing = true;
              }}
            >
              <span class="i-mdi-edit" />
            </button>
          </div>
        {/if}
      </div>
    {:else if canEdit}
      <input type="hidden" name="concluded" value={$form.concluded} />
      <div class="flex w-full max-w-lg justify-between gap-1">
        <Input
          name="title"
          placeholder="Titel"
          class="input-sm"
          bind:value={$form.title}
          error={$errors.title}
          {...$constraints.title}
        />
        <Input
          name="comment"
          placeholder="Kommentar"
          class="input-sm"
          bind:value={$form.comment}
          error={$errors.comment}
          {...$constraints.comment}
        />
        <div class="flex items-center gap-2">
          <button type="submit" class="btn btn-secondary btn-outline btn-xs"> Spara </button>
          <button
            type="button"
            class="btn btn-square btn-secondary btn-outline btn-xs"
            on:click={() => {
              isEditing = false;
            }}
          >
            <span class="i-mdi-cancel-bold" />
          </button>
        </div>
      </div>
    {/if}
  </form>
</li>
