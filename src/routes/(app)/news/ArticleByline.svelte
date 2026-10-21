<script lang="ts">
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let {
    member,
    customAuthor = null,
    position,
    type = "Member",
    committee = null,
    links = true,
  }: {
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
    >;
    customAuthor?: Pick<
      ExtendedPrismaModel<"CustomAuthor">,
      "name" | "imageUrl"
    > | null;
    position?: Pick<ExtendedPrismaModel<"Position">, "id" | "name">;
    type?: ExtendedPrismaModel<"Author">["type"];
    committee?: Pick<
      ExtendedPrismaModel<"Committee">,
      "shortName" | "symbolUrl" | "name"
    > | null;
    links?: boolean;
  } = $props();
</script>

<div class="flex min-w-0 flex-row items-center gap-2">
  <AuthorCard {member} {customAuthor} {position} {type} {links} />
  {#if committee}
    <div class="bg-border h-8 w-px shrink-0"></div>
    <div class="flex min-w-0 flex-row items-center gap-2">
      <CommitteeSymbol {committee} />
      <span class="text-muted-foreground truncate">{committee.name}</span>
    </div>
  {/if}
</div>
