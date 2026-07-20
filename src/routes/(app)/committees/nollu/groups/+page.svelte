<script lang="ts">
  import { type PageData } from "./$types";
  import PhadderGroup from "./PhadderGroup.svelte";

  let { data }: { data: PageData } = $props();
</script>

{#each data.phadderGroups as phadderGroup (phadderGroup.id)}
  <PhadderGroup group={phadderGroup} />
{/each}
