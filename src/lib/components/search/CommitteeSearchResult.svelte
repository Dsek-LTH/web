<script lang="ts">
  import type { CommitteeSearchReturnAttributes } from "$lib/search/searchTypes";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import { languageTag } from "$paraglide/runtime";

  export let committee: CommitteeSearchReturnAttributes;
</script>

<li>
  <a
    href={"/committees/" + committee.shortName}
    class="search-result border border-transparent focus:border-primary"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      <figure class="relative w-full">
        <CommitteeIcon {committee} />
      </figure>
    </div>
    <div>
      <h4>
        <b>
          {languageTag() === "sv" ? committee.nameSv : committee.nameEn}
        </b>
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {languageTag() === "sv"
          ? committee.descriptionSv
          : committee.descriptionEn}
      </p>
    </div></a
  >
</li>
