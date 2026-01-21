<script lang="ts">
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let {
    mandate,
    compact = false,
  }: {
    mandate: ExtendedPrismaModel<"Mandate"> & {
      position: ExtendedPrismaModel<"Position"> & {
        committee: ExtendedPrismaModel<"Committee">;
      };
    };
    compact?: boolean;
  } = $props();
</script>

<div
  class="{compact
    ? 'gap-2'
    : 'w-84 gap-4 border-[1px] p-3'} inline-flex flex-row items-center rounded-md"
>
  <CommitteeSymbol size="sm" committee={mandate.position.committee} />
  <div class="flex flex-col justify-center">
    {#if compact}
      <h5>{mandate.position.name}</h5>
    {:else}<h6>
        {mandate.position.name}
      </h6>{/if}
    {#if !compact}
      <p class="mt-0">{mandate.position.committee.name}</p>
    {/if}
  </div>
</div>
