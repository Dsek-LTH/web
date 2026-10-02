<script lang="ts">
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import {
    formatGoingList,
    formatInterestedList,
  } from "$lib/events/pluralization";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  type Member = ExtendedPrismaModel<"Member">;

  let {
    interested,
    going,
  }: {
    interested: Member[];
    going: Member[];
  } = $props();
</script>

{#snippet memberList(label: string, members: Member[])}
  {#if members.length > 0}
    <Dialog.Root>
      <Dialog.Trigger
        class="text-muted-foreground hover:text-foreground w-fit text-left text-sm underline-offset-2 hover:underline"
      >
        {label}
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{label}</Dialog.Title>
        </Dialog.Header>
        <ul class="flex max-h-96 flex-col overflow-y-auto">
          {#each members as member (member.id)}
            <li>
              <AuthorCard
                lazy
                {member}
                customAuthor={null}
                position={undefined}
              />
            </li>
          {/each}
        </ul>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
{/snippet}

<div class="flex flex-col gap-1">
  {@render memberList(formatGoingList(going), going)}
  {@render memberList(formatInterestedList(interested), interested)}
</div>
