<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import type { Tag } from "@prisma/client";
  import AutoComplete from "./AutoComplete.svelte";
  export let allTags: Tag[] = [];
  export let selectedTags: Tag[] = [];
</script>

<AutoComplete
  options={allTags}
  bind:selected={selectedTags}
  filter={(option, searchValue) => option.name.toLowerCase().includes(searchValue)}
  {...$$restProps}
>
  <TagChip slot="selected-option" let:option tag={option} />
  <!-- <span slot="option" let:option>{option.name}</span> -->
  <TagChip slot="option" let:option tag={option} />
</AutoComplete>
