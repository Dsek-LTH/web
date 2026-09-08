<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import FileText from "@lucide/svelte/icons/file-text";
  import dayjs from "dayjs";

  let { data } = $props();
  let readme = $derived(data.readme);
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
  <Button variant="ghost" href="/" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold">
        {m.readme_title({ number: readme.number, year: readme.year })}
      </CardTitle>
      <p class="text-muted-foreground text-sm">{readme.title}</p>
      {#if readme.publishedAt}
        <p class="text-muted-foreground text-sm">
          {m.readme_publishedOn({
            date: dayjs(readme.publishedAt).format("YYYY-MM-DD"),
          })}
        </p>
      {/if}
    </CardHeader>
    <CardContent class="flex justify-center pt-6">
      <Button href={readme.url} target="_blank" class="flex items-center gap-2">
        <FileText class="h-4 w-4" />
        {m.readme_view()}
      </Button>
    </CardContent>
  </Card>
</div>
