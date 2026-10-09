<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { getFullName } from "$lib/utils/client/member";
  import * as m from "$paraglide/messages";
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import * as Dialog from "$lib/components/ui/dialog";

  let { likers }: { likers: Array<ExtendedPrismaModel<"Member">> } = $props();

  const formatLikersList = (
    likers: Array<ExtendedPrismaModel<"Member">>,
  ): string => {
    switch (likers.length) {
      case 0:
        return "";
      case 1:
        return m.news_likesThis({ x: getFullName(likers[0]!) });
      case 2:
        return m.news_two({
          name1: getFullName(likers[0]!),
          name2: getFullName(likers[1]!),
        });
      default:
        return m.news_threeOrMore({
          name1: getFullName(likers[0]!),
          name2: getFullName(likers[1]!),
          others: likers.length - 2,
        });
    }
  };

  let likersText = $derived(formatLikersList(likers));
</script>

{#if likers.length > 0}
  <Dialog.Root>
    <Dialog.Trigger
      class="text-muted-foreground hover:text-foreground w-fit text-left text-sm underline-offset-2 hover:underline"
    >
      {likersText}
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{m.news_likes()}</Dialog.Title>
      </Dialog.Header>
      <ul class="flex max-h-96 flex-col overflow-y-auto">
        {#each likers as liker (liker.id)}
          <li>
            <AuthorCard
              lazy
              member={liker}
              customAuthor={null}
              position={undefined}
            />
          </li>
        {/each}
      </ul>
    </Dialog.Content>
  </Dialog.Root>
{/if}
