<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import type { PositionSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";

  export let position: PositionSearchReturnAttributes;
</script>

<li>
  <a
    href={"/positions/" + position.dsekId}
    class="border border-transparent focus:border-primary"
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
        {#if languageTag() === "en"}
          {position.nameEn}
        {:else}
          {position.name}
        {/if}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {#if languageTag() === "en"}
          {position.descriptionEn}
        {:else}
          {position.description}
        {/if}
      </p>
    </div>
  </a>
</li>
