<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export let group: ExtendedPrismaModel<"PhadderGroup"> & {
    nollor: Array<ExtendedPrismaModel<"Member">>;
    phaddrar: Array<
      ExtendedPrismaModel<"Mandate"> & {
        member: ExtendedPrismaModel<"Member">;
      }
    >;
  };
</script>

<li class="flex flex-col items-center gap-2">
  {#if group.imageUrl}
    <img
      src={group.imageUrl}
      alt="Group logo"
      class="max-h-24 max-w-full rounded-box object-contain object-top"
    />
  {/if}
  <div>
    <h1 class="text-center font-medium">{group.name}</h1>
    {#if group.description}
      <MarkdownBody class="text-center" body={group.description} />
    {/if}
    <div class="mt-2 flex justify-center gap-2">
      <MembersList class="btn btn-outline btn-sm" members={group.nollor}
        >Nollor</MembersList
      >
      <MembersList
        class="btn btn-outline btn-sm"
        members={group.phaddrar.map((p) => p.member)}>Phaddrar</MembersList
      >
    </div>
  </div>
</li>
