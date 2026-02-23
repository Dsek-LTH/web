<script lang="ts">
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let {
    mandate,
    compact = false,
  }: {
    mandate: ExtendedPrismaModel<"Mandate"> & {
      position: (ExtendedPrismaModel<"Position"> | null) & {
        committee: ExtendedPrismaModel<"Committee"> | null;
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
  {#if mandate.position && mandate.position.committee}<a
      href="/committees/{mandate.position.committee.shortName}"
      ><CommitteeSymbol size="sm" committee={mandate.position.committee} /></a
    >{/if}
  <div class="flex flex-col justify-center">
    <a href="/positions/{mandate.position.id}">
      {#if compact}
        <h5 class="hover:text-muted-foreground transition-all">
          {mandate.position?.name}
        </h5>
      {:else}<h6 class="hover:text-muted-foreground transition-all">
          {mandate.position?.name}
        </h6>{/if}
    </a>
    {#if !compact}
      <a
        class="hover:text-muted-foreground transition-all"
        href="/committees/{mandate?.position?.committee?.shortName}"
      >
        <p class="mt-0">{mandate.position?.committee?.name}</p>
      </a>
    {/if}
  </div>
</div>
