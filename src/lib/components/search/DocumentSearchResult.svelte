<script lang="ts">
  import type {
    GoverningDocumentSearchReturnAttributes,
    MeetingDocumentSearchReturnAttributes,
  } from "$lib/search/searchTypes";

  export let document: (
    | GoverningDocumentSearchReturnAttributes
    | MeetingDocumentSearchReturnAttributes
  ) & { type: "gov" | "meeting" };

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
    href={getUrl(document.url)}
    class="search-result border border-transparent focus:border-primary"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      {#if document.type === "gov"}
        <span class="i-mdi-gavel text-2xl"></span>
      {:else}
        <span class="i-mdi-text-box-multiple-outline text-2xl"></span>
      {/if}
    </div>
    <div>
      <h4>
        {document.title ? document.title : document.content.slice(0, 20)}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {document.content}
      </p>
    </div>
  </a>
</li>
