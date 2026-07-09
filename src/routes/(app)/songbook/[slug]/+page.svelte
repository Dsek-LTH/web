<script lang="ts">
  import { Badge } from "$lib/components/ui/badge/index.js";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";

  let { data } = $props();
  let song = $derived(data.song);
</script>

<div class="mx-auto max-w-3xl">
  <Button variant="ghost" href="/songbook" class="mb-4">
    <ArrowLeft class="mr-2 h-4 w-4" />
    Back to Songbook
  </Button>

  <Card>
    <CardHeader>
      <div class="flex items-start justify-between">
        <div>
          <CardTitle class="mb-2 text-4xl">{song.title}</CardTitle>
          {#if song.melody}
            <CardDescription class="text-lg">
              Melody: {song.melody}
            </CardDescription>
          {/if}
        </div>
        {#if song.category}
          <Badge variant="outline" class="text-base">{song.category}</Badge>
        {/if}
      </div>
    </CardHeader>
    <CardContent>
      <div class="mt-6 whitespace-pre-wrap font-serif text-lg leading-relaxed">
        {song.lyrics}
      </div>
    </CardContent>
  </Card>
</div>
