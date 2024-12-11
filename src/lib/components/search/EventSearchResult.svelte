<script lang="ts">
  import type { EventSearchReturnAttributes } from "$lib/search/searchTypes";
  export let event: EventSearchReturnAttributes;
</script>

<li>
  <a
    href={"/events/" + event.slug}
    class="search-result border border-transparent focus:border-primary"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      <span class="i-mdi-calendar text-2xl"></span>
    </div>
    <div>
      <h4>
        {event.title}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {event.description}
      </p>
    </div>
  </a>
</li>
