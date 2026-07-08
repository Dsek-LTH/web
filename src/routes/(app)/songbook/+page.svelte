<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import { Card, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { resolve } from "$app/paths";

  let { data } = $props();
</script>

<div class="container mx-auto py-8">
  <h1 class="mb-4 text-3xl font-bold">{m.songBook()}</h1>
  <p class="text-muted-foreground mb-8">{m.songbook_hereYouWillFind ? m.songbook_hereYouWillFind() : m.songbook_hereYoullFind ? (m as any).songbook_hereYoullFind() : ""}</p>

  <form method="GET" class="mb-8 space-y-4">
    <div class="flex gap-2">
      <Input
        type="text"
        name="search"
        placeholder="Search..."
        value={data.search}
        class="max-w-md"
      />
      <Button type="submit">Search</Button>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each data.categories as category (category)}
        {@const isSelected = data.categoryFilter.includes(category)}
        <label class="cursor-pointer">
          <Badge variant={isSelected ? "lila" : "outline"}>
            {category}
          </Badge>
          <input
            type="checkbox"
            name="category"
            value={category}
            checked={isSelected}
            class="hidden"
            onchange={(e) => e.currentTarget.form?.submit()}
          />
        </label>
      {/each}
    </div>

    <input type="hidden" name="page" value="1" />
  </form>

  <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.songs as song (song.id)}
      <a
        href={resolve(`/songbook/${song.slug}`)}
        class="block h-full transition-transform hover:scale-[1.02]"
      >
        <Card class="h-full cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle>{song.title}</CardTitle>
            {#if song.category}
              <CardDescription>
                <Badge variant="outline" class="mt-2">{song.category}</Badge>
              </CardDescription>
            {/if}
          </CardHeader>
        </Card>
      </a>
    {:else}
      <p class="text-muted-foreground">No songs found.</p>
    {/each}
  </div>

  {#if data.pageCount > 1}
    <div class="flex justify-center gap-2">
      {#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as pageNum (pageNum)}
        <form method="GET" class="inline">
          <input type="hidden" name="search" value={data.search} />
          {#each data.categoryFilter as category (category)}
            <input type="hidden" name="category" value={category} />
          {/each}
          <input type="hidden" name="page" value={pageNum} />
          <Button
            type="submit"
            variant={pageNum === data.currentPage ? "lila" : "outline"}
            size="sm"
          >
            {pageNum}
          </Button>
        </form>
      {/each}
    </div>
  {/if}

  <p class="text-muted-foreground mt-12 text-sm italic">
    {m.songbook_disclaimer()}
  </p>
</div>
