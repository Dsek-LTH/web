<script lang="ts">
  import type { Tag as TagType } from "@prisma/client";
  import AutoComplete from "./AutoComplete.svelte";
  import Tag from "$lib/components/Tag.svelte";
  export let allTags: TagType[] = [];
  export let selectedTags: TagType[] = [];
  $: console.log(selectedTags);
</script>

<AutoComplete options={allTags} bind:selected={selectedTags} multiple>
  <Tag slot="selected-option" let:option tag={option} />
  <!-- <span slot="option" let:option>{option.name}</span> -->
  <Tag slot="option" let:option tag={option} />
</AutoComplete>
