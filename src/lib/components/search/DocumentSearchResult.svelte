<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import type {
    GoverningDocumentSearchReturnAttributes,
    MeetingDocumentSearchReturnAttributes,
  } from "$lib/search/searchTypes";
  import FileText from "@lucide/svelte/icons/file-text";
  const {
    data,
  }: {
    data:
      | GoverningDocumentSearchReturnAttributes
      | MeetingDocumentSearchReturnAttributes;
  } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={data.url}
  data-search-result
>
  <div class="flex flex-row items-center gap-2">
    <FileText />
    <div class="flex flex-col">
      <span class="font-medium">{data.title}</span>
      <span class="text-muted-foreground line-clamp-1">
        {data.content}
      </span>
    </div>
  </div>
</Command.LinkItem>
