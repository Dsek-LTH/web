<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import BodyContent from "../BodyContent.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<BodyContent {data} />

<MarkdownBody
  class="text-foreground flex max-w-full flex-col gap-2 text-sm"
  body={data.markdown?.markdown ?? ""}
/>
