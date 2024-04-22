<script lang="ts">
  import { type Tag } from "@prisma/client";

  export let subscribedTags: { subscribedTags: Tag[] };
  export let nonSubscribedTags: Tag[];

  const removeTag = (tagToRemove: Tag) => {
    nonSubscribedTags.push(tagToRemove);
    nonSubscribedTags = nonSubscribedTags; // Required to rerender
    subscribedTags.subscribedTags = subscribedTags.subscribedTags.filter(
      (tag) => tag.id != tagToRemove.id,
    );
  };

  const addTag = (tagToAdd: Tag) => {
    subscribedTags.subscribedTags.push(tagToAdd);
    subscribedTags.subscribedTags = subscribedTags.subscribedTags; // Required to rerender
    nonSubscribedTags = nonSubscribedTags.filter(
      (tag) => tag.id != tagToAdd.id,
    );
  };
</script>

<div>
  <!-- {#each tags as tag} -->
  <!-- <label
      class="rounded-full p-1"
      style={"background-color: " + tag.color + ";"}
    >
      {tag.name}
      <input
        type="checkbox"
        class="peer sr-only"
        checked={tags.map((tag) =>
          subscribedTags.subscribedTags.find((subTag) => tag.id == subTag.id),
        ) != undefined}
      />
      <div />
    </label>
  {/each} -->
  <h3 class="text-xl font-bold">Aktiva</h3>
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
  </div>
</div>
