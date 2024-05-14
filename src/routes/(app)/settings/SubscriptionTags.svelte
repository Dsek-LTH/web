<script lang="ts">
  import { type Tag } from "@prisma/client";

  export let subscribedTags: Tag[];
  export let tags: Tag[];

  let selectedTags: string[] = tags
    .map((tag) => {
      if (subscribedTags.find((subTag) => subTag.id == tag.id)) return tag.id;
      else return "";
    })
    .filter((t) => t != "");
</script>

<div class="flex flex-col items-center xl:grid xl:grid-cols-2">
  {#each tags as tag}
    <div class="m-1 flex">
      <label
        class="flex cursor-pointer items-center whitespace-nowrap rounded-full border pl-2"
        style={"border-color: " + tag.color + ";"}
      >
        <input
          type="checkbox"
          class="peer sr-only"
          name="tag"
          bind:group={selectedTags}
          value={tag.id}
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
</div>
