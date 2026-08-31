<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import type { PositionSearchReturnAttributes } from "$lib/search/searchTypes";
  import { getLocale } from "$paraglide/runtime";

  export let position: PositionSearchReturnAttributes;
</script>

<li>
  <a
    href={"/positions/" + position.dsekId}
    class="search-result border border-transparent focus:border-primary"
  >
    {#if position.committee !== null}
      <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
        <figure class="relative w-full">
          <CommitteeIcon committee={position.committee} />
        </figure>
      </div>
    {/if}
    <div>
      <h4>
        {getLocale() === "sv" ? position.nameSv : position.nameEn}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {getLocale() === "sv" ? position.descriptionSv : position.descriptionEn}
      </p>
    </div>
  </a>
</li>
