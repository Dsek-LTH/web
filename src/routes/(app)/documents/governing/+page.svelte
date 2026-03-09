<script lang="ts">
  import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
  } from "$lib/components/ui/item";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import * as m from "$paraglide/messages";
  import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";

  let { data } = $props();
</script>

{#snippet documentItem(text: string, url: string)}
  <Item variant="outline" size="sm">
    {#snippet child({ props })}
      <a href={url} {...props}>
        <ItemMedia>
          <FileTextIcon className="size-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{text}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <DownloadIcon className="size-4" />
        </ItemActions>
      </a>
    {/snippet}
  </Item>
{/snippet}

<div class="layout-container space-y-8">
  <header>
    <h1>{m.documents_governing()}</h1>
    <p>{m.documents_governing_blurb()}</p>
    <p>
      {m.documents_governing_forQuestions()}
      <a
        href="mailto:styrelsen@dsek.se"
        class="link link-primary no-underline hover:underline"
      >
        styrelsen@dsek.se
      </a>
    </p>
  </header>

  <section class="space-y-2">
    {@render documentItem(m.documents_governing_statutes(), "/stadgar")}
    {@render documentItem(m.documents_governing_regulations(), "/reglemente")}
  </section>

  <section>
    <Card class="-my-4 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Policies</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction></CardAction>
      </CardHeader>
      <CardContent>Test</CardContent>
    </Card>
  </section>

  <section class="rounded-lg p-4">
    <h2 class="mb-2">{m.documents_governing_policies()}</h2>
    <div class="flex flex-col gap-2">
      {#each data.policies as policy (policy.id)}
        {@render documentItem(policy.title, policy.url)}
      {/each}
    </div>
  </section>
</div>
