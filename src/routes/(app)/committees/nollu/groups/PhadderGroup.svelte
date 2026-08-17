<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MembersList from "$lib/components/MembersList.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import * as m from "$paraglide/messages";

  let {
    group,
  }: {
    group: ExtendedPrismaModel<"PhadderGroup"> & {
      nollor: Array<ExtendedPrismaModel<"Member">>;
      phaddrar: Array<
        ExtendedPrismaModel<"Mandate"> & {
          member: ExtendedPrismaModel<"Member">;
        }
      >;
    };
  } = $props();
</script>

<div class="flex flex-col items-center gap-2 text-center">
  {#if group.imageUrl}
    <img
      src={group.imageUrl}
      alt="Group logo"
      class="max-h-24 max-w-full rounded-md object-contain object-top"
    />
  {:else}
    <div class="bg-border/45 size-24 rounded-lg"></div>
  {/if}
  <div>
    <h4>{group.name}</h4>
    {#if group.description}
      <MarkdownBody class="text-center" body={group.description} />
    {/if}
    <div class="mt-2 flex justify-center gap-2">
      <MembersList
        variant="outline"
        title="{m.nollor_in()} {group.name}"
        members={group.nollor}>{m.nollor()}</MembersList
      >
      <MembersList
        variant="outline"
        title="{m.phaddrar_in()}  {group.name}"
        members={group.phaddrar.map((p) => p.member)}
        >{m.phaddrar()}</MembersList
      >
    </div>
  </div>
</div>
