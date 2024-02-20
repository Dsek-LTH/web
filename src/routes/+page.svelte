<script lang="ts">
  import { marked } from "marked";

  import type { PageData } from "./$types";
  import GlobalAlert from "$lib/components/GlobalAlert.svelte";
  import { languageTag } from "$paraglide/runtime";
  export let data: PageData;

  console.log(data.alert);
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

{#each data.alert as alert}
  <GlobalAlert
    message={languageTag() === "sv" ? alert.message : alert.messageEn}
    severity={alert.severity}
  />
{/each}
<div
  class="container mx-auto grid grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3"
>
  <header class="contents">
    <img
      class="h-full w-full object-cover md:col-span-2"
      src="./hero-image.jpg"
      alt="Cover"
    />
    <h1 class="text-balance text-5xl font-bold lg:text-6xl">
      Det <span class="text-primary">roliga</span> med plugget
    </h1>
    <div>
      <p class="mb-8">
        <strong>D-sektionen inom TLTH</strong> är en ideell organisation för
        studenter och alumner vid programmen
        <span class="text-primary">Datateknik</span> och
        <span class="text-secondary">InfoCom</span>. Sektionen har sociala
        arrangemang, näringslivskontakter, studiebevakning, och allt annat som
        hjälper studenter och alumner.
      </p>
      <a
        class="btn btn-primary justify-self-start rounded-none px-10 font-bold uppercase"
        href="/info/for-foretag"
      >
        För företag
      </a>
    </div>
  </header>

  <article
    class="row-span-6 bg-primary px-6 py-3 lg:col-start-3 lg:row-span-2 lg:row-start-1"
  >
    <ol class="flex flex-col divide-y divide-dotted divide-stone-700">
      {#each data.news as article}
        <li class="py-5 text-black">
          <a href="/news/{article.slug}">
            <h2 class="mb-2 text-xl font-bold">{article.header}</h2>
            <p class="line-clamp-3 break-words">
              <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
              {@html marked(article.body)}
            </p>
          </a>
        </li>
      {/each}
    </ol>
  </article>

  <ol class="contents" role="article">
    {#each data.events as event}
      <li>
        <a href="/events/{event.slug}" class="flex align-top">
          <div class="mr-5 h-24 w-24 min-w-24 bg-base-300">
            <div
              class="flex h-5 items-center justify-center bg-primary text-sm font-bold capitalize text-black"
            >
              {event.startDatetime.toLocaleString("sv-SE", {
                weekday: "long",
              })}
            </div>
            <p class="text-center text-6xl font-semibold">
              {event.startDatetime.getDay().toString().padStart(2, "0")}
            </p>
          </div>

          <div class="min-w-0">
            <h2 class="mb-4 text-xl font-bold leading-none">
              {event.title}
            </h2>
            <p class="line-clamp-3 break-words">
              <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
              {@html marked(event.description)}
            </p>
          </div>
        </a>
      </li>
    {/each}
  </ol>

  <a
    class="flex cursor-pointer gap-6 bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
    href="/committees/cafe"
  >
    <span class="i-mdi-coffee self-center text-2xl" />

    <article>
      <p>Caféets öppettider</p>
      <h2 class="text-xl font-bold">
        {#if data.cafeOpen}
          {data.cafeOpen.markdown}
        {:else}
          N/A
        {/if}
      </h2>
    </article>
  </a>

  <a
    class="flex cursor-pointer gap-6 bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
    href="/documents"
  >
    <span class="i-mdi-gavel self-center text-2xl" />

    <article class="flex-1">
      <p>Nästa möte</p>
      <h2 class="text-xl font-bold">
        {#if data.meetings.upcoming}
          {data.meetings.upcoming.title}
        {:else}
          TBD
        {/if}
      </h2>
    </article>

    {#if data.meetings.previous}
      <article>
        <p class="font-light">Senaste möte</p>
        <h2 class="text-xl font-light">
          {data.meetings.previous.title}
        </h2>
      </article>
    {/if}
  </a>

  <a
    class="flex cursor-pointer gap-6 bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
    href="https://bit.ly/kontaktatrivsel"
  >
    <span class="i-mdi-speak self-center text-2xl" />

    <article>
      <p>Tankar eller åsikter?</p>
      <h2 class="text-xl font-bold">Kontakta Trivselrådet</h2>
    </article>
  </a>
</div>
