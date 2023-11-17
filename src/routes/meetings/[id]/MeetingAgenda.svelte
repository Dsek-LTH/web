<script lang="ts">
  import { page } from "$app/stores";
  import Labeled from "$lib/components/Labeled.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { MeetingAgendaItem, MeetingAttachment } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddItemSchema, UpdateItemSchema } from "./+page.server";
  import { superForm } from "sveltekit-superforms/client";
  import AgendaItem from "./AgendaItem.svelte";

  export let items: (MeetingAgendaItem & {
    attachments: MeetingAttachment[];
  })[];
  export let addItemsForm: SuperValidated<AddItemSchema>;
  export let updateItemsForm: SuperValidated<UpdateItemSchema>;
  const { form, errors, enhance } = superForm(addItemsForm, {
    dataType: "json",
  });
  let isAdding = false;
  let newItems: { title: string; order: number }[] = [];
</script>

<header class="flex justify-between">
  <h1 class="text-xl font-semibold">Mötesagenda</h1>
  {#if $page.data.accessPolicies.includes(apiNames.MEETINGS.UPDATE)}
    <button
      class="btn btn-secondary btn-outline btn-sm"
      on:click={() => {
        isAdding = !isAdding;
      }}
    >
      {isAdding ? "Avbryt" : "Lägg till"}
    </button>
  {/if}
</header>
<div class="flex">
  <ol class="steps steps-vertical flex-1">
    {#each items as item, index (item.id)}
      <AgendaItem {item} data={updateItemsForm} previousItem={items[index - 1]} />
    {/each}
  </ol>

  {#if isAdding}
    <form
      action="?/addItems"
      method="POST"
      class="form-control join join-vertical my-4"
      use:enhance
    >
      {#if $errors.items && "_errors" in $errors.items}
        <ul class="list-inside list-disc">
          {#each $errors.items._errors ?? [] as error}
            <li class="text-error">{error}</li>
          {/each}
        </ul>
      {/if}
      <Labeled id="list">
        <textarea
          id="list"
          rows="10"
          placeholder="En punkt per rad..."
          class="textarea join-item textarea-bordered w-full"
          on:change={(e) => {
            const text = e.currentTarget.value;
            form.update((f) => {
              f.items = [];
              let order = 0;
              text.split("\n").forEach((line) => {
                if (line.trim() === "") return;
                let title = line;
                // Removes preceding numbers and a dot
                if (/^\d+\.?\s/.test(line)) {
                  title = line.replace(/^\d+\.\s/, "");
                }
                f.items[order] = { title, order };
                order++;
              });
              return f;
            });
          }}
        />
      </Labeled>
      <input type="hidden" name="items" value={JSON.stringify(newItems)} />
      <button class="btn btn-secondary join-item">Skapa</button>
    </form>
  {/if}
</div>
