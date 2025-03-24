<script lang="ts">
  import type { SearchDataWithType } from "$lib/search/searchTypes";

  export let document: Extract<
    SearchDataWithType,
    { type: "governingDocuments" | "meetingDocuments" }
  >;
  $: data = document.data;

  const getUrl = (url: string) => {
    if (url.startsWith("http")) {
      return url;
    } else {
      // We store the url of governing documents as
      // relative paths, and that logic is handled in the
      // api/pdf endpoint
      return `/api/pdf/${url}`;
    }
  };
</script>

<li>
  <a
    href={getUrl(data.url)}
    class="search-result border border-transparent focus:border-primary"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      {#if document.type === "governingDocuments"}
        <span class="i-mdi-gavel text-2xl"></span>
      {:else}
        <span class="i-mdi-text-box-multiple-outline text-2xl"></span>
      {/if}
    </div>
    <div>
      <h4>
        {data.title ? data.title : data.content.slice(0, 20)}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {data.content}
      </p>
    </div>
  </a>
</li>
