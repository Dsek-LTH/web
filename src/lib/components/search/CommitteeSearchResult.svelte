<script lang="ts">
  import type { CommitteeSearchReturnAttributes } from "$lib/search/searchTypes";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";

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
          {committee.name}
        </b>
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {committee.description}
      </p>
    </div></a
  >
</li>
