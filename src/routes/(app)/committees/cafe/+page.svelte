<script lang="ts">
  import BodyContent from "../BodyContent.svelte";
  import type { PageData } from "../$types";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import CafeTimes from "./CafeTimes.svelte";

  let { data }: { data: PageData } = $props();
</script>

<BodyContent {data} />

<div class="flex flex-row">
  <MarkdownBody
    class="text-foreground flex max-w-full flex-col gap-2 text-sm"
    body={data.markdown?.markdown ?? ""}
  />
  <CafeTimes openingHours={data.openingHours} {data} />
</div>
