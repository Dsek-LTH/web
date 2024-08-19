<script lang="ts">
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import * as m from "$paraglide/messages";
  import type { Member } from "@prisma/client";

  export let likers: Member[];

  const formatLikersList = (likers: Member[]): string => {
    switch (likers.length) {
      case 0:
        return "";
      case 1:
        return getFullName(likers[0]!);
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

  $: likersText = formatLikersList(likers);
</script>

<MembersList members={likers} class="link text-sm opacity-40 hover:opacity-60">
  {likersText}
</MembersList>
