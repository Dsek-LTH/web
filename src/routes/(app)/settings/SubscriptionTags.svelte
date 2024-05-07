<script lang="ts">
  import type { SettingsSchema, TagSchema } from "$lib/zod/schemas";
  import { type Tag } from "@prisma/client";
  import { superForm } from "sveltekit-superforms/client";
  import type { SuperValidated } from "sveltekit-superforms";

  export let subscribedTags: Tag[];
  export let tags: Tag[];

  // const removeTag = (tagToRemove: Tag) => {
  //   nonSubscribedTags.push(tagToRemove);
  //   nonSubscribedTags = nonSubscribedTags; // Required to rerender
  //   subscribedTags.subscribedTags = subscribedTags.subscribedTags.filter(
  //     (tag) => tag.id != tagToRemove.id,
  //   );
  // };

  // const addTag = (tagToAdd: Tag) => {
  //   subscribedTags.subscribedTags.push(tagToAdd);
  //   subscribedTags.subscribedTags = subscribedTags.subscribedTags; // Required to rerender
  //   nonSubscribedTags = nonSubscribedTags.filter(
  //     (tag) => tag.id != tagToAdd.id,
  //   );
  // };

  export let data: SuperValidated<SettingsSchema>;

  const { form } = superForm(data);
  let selected = tags.map(
    (tag) => subscribedTags.find((subTag) => subTag.id == tag.id) != undefined,
  );
</script>

<div class="flex flex-col items-center xl:grid xl:grid-cols-2">
  {#each tags as tag, index}
    <div class="m-1 flex">
      <label
        class="flex cursor-pointer items-center whitespace-nowrap rounded-full border pl-2"
        style={"border-color: " + tag.color + ";"}
      >
        <input
          type="checkbox"
          class="peer sr-only"
          bind:group={}
          bind:checked={selected[index]}
          value={tag}
        />
        <span
          class="ms-3 pb-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          {tag.name}
        </span>
        <div
          class="peer relative ml-2 mr-1 h-5 w-9 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-gray-800"
        ></div>
      </label>
    </div>
  {/each}
  <!-- <h3 class="text-xl font-bold">Aktiva</h3>
  <div>
    {#each subscribedTags.subscribedTags as tag}
      <button
        type="button"
        class="button-color-darkmode rounded-2xl border border-gray-400"
        style={"background-color: " +
          (tag.color != null && tag.color ? tag.color : "white") +
          "; padding: 2px 10px 2px 10px; margin: 2px; color: black;"}
        on:click={() => removeTag(tag)}>{tag.name}</button
      >
    {/each}
  </div>
  <br />
  <h3 class="text-xl font-bold">Inaktiva</h3>
  <div>
    {#each nonSubscribedTags as tag}
      <button
        type="button"
        class="button-color-darkmode rounded-2xl border border-gray-400"
        style={"background-color: " +
          (tag.color != null && tag.color ? tag.color : "white") +
          "; padding: 2px 10px 2px 10px; margin: 2px; color: black;"}
        on:click={() => addTag(tag)}>{tag.name}</button
      >
    {/each}
  </div> -->
</div>
