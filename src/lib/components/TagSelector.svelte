<script lang="ts">
  import type { Tag } from "@prisma/client";
  import AutoComplete from "./AutoComplete.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  export let allTags: Tag[] = [];
  export let selectedTags: Tag[] = [];
</script>

<AutoComplete options={allTags} bind:selected={selectedTags} multiple>
  <TagChip slot="selected-option" let:option tag={option} />
  <!-- <span slot="option" let:option>{option.name}</span> -->
  <TagChip slot="option" let:option tag={option} />
</AutoComplete>
