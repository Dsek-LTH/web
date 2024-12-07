<script lang="ts">
  import type { EventSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";
  export let event: EventSearchReturnAttributes;
</script>

<li>
  <a
    href={"/events/" + event.slug}
    class="border border-transparent focus:border-primary"
    id=".search-result"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      <span class="i-mdi-calendar text-2xl"></span>
    </div>
    <div>
      <h4>
        {#if languageTag() === "en"}
          {event.titleEn}
        {:else}
          {event.title}
        {/if}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {#if languageTag() === "en"}
          {event.descriptionEn}
        {:else}
          {event.description}
        {/if}
      </p>
    </div>
  </a>
</li>
