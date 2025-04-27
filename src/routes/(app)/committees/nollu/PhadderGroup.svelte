<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import type { Mandate, Member, PhadderGroup } from "@prisma/client";

  interface Props {
    group: PhadderGroup & {
      nollor: Member[];
      phaddrar: Array<
        Mandate & {
          member: Member;
        }
      >;
    };
  }

  let { group }: Props = $props();
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
