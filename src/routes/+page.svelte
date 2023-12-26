<script lang="ts">
  import { marked } from "marked";

  export let data;
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

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
      <button
        class="btn btn-primary justify-self-start rounded-none px-10 font-bold uppercase"
      >
        För företag
      </button>
    </div>
  </header>

  <article
    class="row-span-3 bg-primary px-6 py-8 lg:col-start-3 lg:row-span-2 lg:row-start-1"
  >
    <h1 class="text-5xl font-bold text-black">Nyheter</h1>
    <ol class="flex flex-col divide-y divide-stone-700">
      {#each data.news as article}
        <li class="py-10 text-black">
          <a href="/news/{article.slug}">
            <h2 class="mb-2 text-xl font-bold">{article.header}</h2>
          </a>
          <p class="line-clamp-3 text-ellipsis break-all">
            <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
            {@html marked(article.body)}
          </p>
        </li>
      {/each}
    </ol>
  </article>

  <ol class="contents" role="article">
    {#each data.events as event}
      <li>
        <div class="flex align-top">
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

          <div>
            <a href="/events/{event.slug}">
              <h2 class="mb-4 text-xl font-bold">{event.title}</h2>
            </a>
            <p class="line-clamp-2 text-ellipsis break-all">
              <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
              {@html marked(event.description)}
            </p>
          </div>
        </div>
      </li>
    {/each}
  </ol>

  <section class="flex justify-between bg-base-300 p-6">
    <article>
      <h2>Senaste mötet</h2>
      <p class="text-xl font-bold">S29</p>
    </article>

    <article>
      <h2>Nästa möte</h2>
      <p class="text-xl font-bold">S30</p>
    </article>
  </section>
</div>
