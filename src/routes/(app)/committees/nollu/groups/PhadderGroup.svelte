<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MembersList from "$lib/components/MembersList.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

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
      class="rounded-box max-h-24 max-w-full object-contain object-top"
    />
  {/if}
  <div>
    <h4>{group.name}</h4>
    {#if group.description}
      <MarkdownBody class="text-center" body={group.description} />
    {/if}
    <div class="mt-2 flex justify-center gap-2">
      <MembersList
        variant="outline"
        title="Nollor i {group.name}"
        members={group.nollor}>Nollor</MembersList
      >
      <MembersList
        variant="outline"
        title="Phaddrar i {group.name}"
        members={group.phaddrar.map((p) => p.member)}>Phaddrar</MembersList
      >
    </div>
  </div>
</div>
