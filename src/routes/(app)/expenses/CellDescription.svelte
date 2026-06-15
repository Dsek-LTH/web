<script lang="ts">
  import Badge from "$lib/components/ui/badge/badge.svelte";
  import Trash from "@lucide/svelte/icons/trash";
  import * as m from "$paraglide/messages";

  let { isRemoved, description }: { isRemoved: boolean; description: string } =
    $props();
</script>

{#if isRemoved}
  <Badge class="bg-red-500 text-white"><Trash /> {m.expense_removed()}</Badge>
{/if}
{description}
