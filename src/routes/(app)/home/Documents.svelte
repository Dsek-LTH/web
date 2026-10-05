<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";
  import * as m from "$paraglide/messages";
  import FileLink from "$lib/components/files/FileLink.svelte";

  let { files }: { files: { next: FileData[]; last: FileData[] } } = $props();
</script>

<div class="max-w-1/2">
  <h2 class="mb-2">
    <a href="/documents" class="hover:text-muted-foreground transition-colors"
      >{m.documents_boardMeetings()}</a
    >
  </h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col rounded-md border-[1px] p-4">
      <div class="flex flex-row items-baseline">
        <h4>
          <a
            href="/documents"
            class="hover:text-muted-foreground transition-colors"
          >
            {files.next[0]?.id.split("/")[2] ?? ""}
          </a>
        </h4>
        <h6>&nbsp;- {m.home_meetingNext()}</h6>
      </div>
      <div class="flex flex-col">
        {#each files.next as file (file.thumbnailUrl)}
          <FileLink
            class="px-2 *:shrink-0"
            name={file.name}
            url={file.thumbnailUrl ?? ""}
            full
          />
        {/each}
      </div>
    </div>

    <!--<Separator orientation="vertical" />-->

    <div class="flex flex-col rounded-md border-[1px] p-4">
      <div class="flex flex-row items-baseline">
        <h4>
          <a
            href="/documents"
            class="hover:text-muted-foreground transition-colors"
          >
            {files.last[0]?.id.split("/")[2] ?? ""}
          </a>
        </h4>
        <h6>&nbsp;- {m.home_meetingPrev()}</h6>
      </div>
      <div class="flex flex-col">
        {#each files.last as file (file.thumbnailUrl)}
          <FileLink
            class="px-2 *:shrink-0"
            name={file.name}
            url={file.thumbnailUrl ?? ""}
            full
          />
        {/each}
      </div>
    </div>
  </div>
</div>
