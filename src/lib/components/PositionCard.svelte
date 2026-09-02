<script lang="ts">
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import { getPositionLink } from "$lib/utils/positions";
  import type { components } from "$lib/api/schema";

  // Sole consumer is the (Go-backed) member profile page - typed against
  // the generated Go API shapes directly rather than
  // ExtendedPrismaModel<...>, unlike CommitteeSymbol (which still has other
  // Prisma consumers and keeps a TEMPORARY dual-shape - see its comment).
  let {
    mandate,
    compact = false,
  }: {
    // Only `.id` and `.position` are read - `startDate`/`endDate` are
    // deliberately omitted from this type (the caller may hold real `Date`
    // objects there for its own grouping logic, which would otherwise
    // clash with the generated schema's `string` dates).
    mandate: Pick<components["schemas"]["Mandate"], "id"> & {
      position: Omit<components["schemas"]["Position"], "committee"> & {
        committee: components["schemas"]["Committee"] | null;
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
    <a href={getPositionLink(mandate.position.id)}>
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
