<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";

  import groupProfile from "./(photos)/staben24_9x16.webp";
  import groupLandscape from "./(photos)/staben24_16x9.webp";

  import cowprint from "./(photos)/cowprint.webp";
  import { languageTag } from "$paraglide/runtime";
  import { env } from "$env/dynamic/public";

  export let data;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;
</script>

<SetPageTitle title="Nollning" />

<article class="-m-6 space-y-16 overflow-hidden p-6">
  {#if data.revealTheme}
    <div
      class="-mx-6 -my-6"
      style={`height: calc(100dvh - ${data.isApp ? headerAndFooterHeight + "px" : "4rem"}); `}
    >
      <figure
        class="relative h-full w-full overflow-hidden border-none bg-neutral"
      >
        <div
          class="h-full w-full bg-cover bg-center bg-no-repeat max-md:bg-scroll md:hidden md:bg-fixed"
          style="background-image: url('{groupProfile}'); box-shadow: inset 0 -100px 100px -100px #303B70;"
        />
        <div
          class="hidden h-full w-full bg-cover bg-center bg-no-repeat max-md:bg-scroll md:block md:bg-fixed"
          style="background-image: url('{groupLandscape}'); box-shadow: inset 0 -100px 100px -100px #303B70;"
        />

        <span
          class="absolute inset-x-4 bottom-10 hidden max-w-full transform text-center font-nolla-stab text-7xl leading-snug md:block lg:text-8xl"
        >
          {data.content["title"] ?? "title"}
        </span>
      </figure>
    </div>
  {/if}
  <!-- limit width and center -->
  <div class="mx-auto max-w-screen-md">
    <section class="flex flex-col">
      <h3 class="page-title !text-3xl text-secondary">
        {data.content["hello_title"] ?? "hello_title"}
      </h3>
      <p class="nolla-prose">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html data.content["hello_body"] ?? "hello_body"}
      </p>
    </section>

    <section class="mb-24 mt-8 flex flex-col">
      <h3 class="page-title mb-4 !text-3xl text-secondary">
        {data.content["policy_header"] ?? "policy_header"}
      </h3>
      <p class="nolla-prose">
        {data.content["policy_subtitle"] ?? "policy_subtitle"}
      </p>
      <ul class="list-inside list-disc leading-relaxed">
        {#each data.content["policy_lines"] as line}
          <li>{line.line}</li>
        {/each}
      </ul>
      <p class="nolla-prose">
        {data.content["policy_readmore"] ?? "policy_readmore"}
      </p>
      <a
        href={`https://minio.api.dsek.se/files/public/miscellaneous/rights-${languageTag()}.pdf`}
        class="btn-primary-dark btn self-start"
        >{data.content["policy_read"] ?? "policy_read"}</a
      >
    </section>
    {#if data["revealTheme"]}
      <div class="relative mx-auto mb-0 mt-12 size-60 md:size-80">
        <img
          src={`${env.PUBLIC_DIRECTUS_API_URL}/assets/${data.content["swirl"]}`}
          class="absolute inset-0 animate-[reverse-spin_30s_linear_infinite]"
          alt="Nollning logo spinning"
        />
        <img
          src={`${env.PUBLIC_DIRECTUS_API_URL}/assets/${data.content["eye"]}`}
          class="absolute inset-0"
          alt="Nollning logo non-spinning"
        />
      </div>
      <section>
        <h3 class="page-title font-nolla-stab !text-4xl text-secondary">
          {data.content["lore_header"] ?? "lore_header"}
        </h3>
        <p class="nolla-prose">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html data.content["lore_body"] ?? "lore_body"}
        </p>
        <iframe
          class="aspect-video w-full"
          src={data.content["reveal_url"]}
          title="Reveal film"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </section>

      <section
        class="relative !my-16 !mb-20 flex min-h-dvh flex-col items-center"
        id="staben"
      >
        <div
          class="absolute -inset-x-[50dvw] -inset-y-10 z-0 bg-cover bg-center bg-no-repeat opacity-15 max-md:bg-scroll md:bg-fixed"
          style={`background-image: url('${env.PUBLIC_DIRECTUS_API_URL}/assets/${data.content["stab_bg"]}')`}
        />
        <h1
          class="z-10 mb-4 rounded-btn p-2 text-center font-nolla-stab text-8xl tracking-wider md:text-9xl"
        >
          Staben
        </h1>
        <div
          class="z-0 -mt-20 w-full scroll-smooth bg-transparent pt-20 max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
        >
          {#each data.stab as stab, index}
            <PersonCarouselItem
              stab
              name={stab.name}
              {index}
              imageUrl={stab.image}
              body={stab.body}
            />
          {/each}
        </div>
      </section>
    {/if}

    <section
      class="relative !mb-32 flex min-h-dvh flex-col items-center max-md:-mx-6"
      id="peppers"
      class:!mt-16={data.revealTheme}
    >
      <div
        class="absolute -inset-x-[50dvw] -inset-y-10 -z-0 opacity-15 max-md:bg-[length:32rem] max-md:bg-scroll md:bg-[length:48rem] md:bg-fixed"
        style={`background-image: url('${env.PUBLIC_DIRECTUS_API_URL}/assets/${data.content["stab_bg"] ?? cowprint}')`}
      />
      <h1
        class="z-10 mb-4 rounded-btn p-2 text-center font-nolla-pepp text-5xl md:text-8xl"
      >
        {data.content["pepp_header"] ?? "pepp_header"}
      </h1>
      <div
        class="-mt-20 w-full scroll-m-20 pt-20 max-md:carousel max-md:!flex md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
      >
        {#each data.pepp as pepper, index (pepper.name)}
          <PersonCarouselItem
            name={pepper.name}
            {index}
            imageUrl={pepper.image}
            body={pepper.body}
          />
        {/each}
      </div>
    </section>
    <iframe
      class="aspect-video w-full"
      src={data.content["dance_url"]}
      title="Nolledans film"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
    <section class="mt-16 flex flex-col items-center">
      <h1 class="mb-16 text-3xl font-medium">{m.phadderGroups()}</h1>
      <div
        class="-mt-20 w-full scroll-smooth pt-20 max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
      >
        {#each data.phadderGroups as group, index}
          <PersonCarouselItem
            name={group.name}
            body={group.description ?? ""}
            imageUrl={group.imageUrl ?? ""}
            {index}
            max={data.phadderGroups.length}
            prefix="groupslide"
            font="text-2xl font-medium"
            rounded={false}
          >
            <div class="mt-2 flex justify-center gap-2">
              <MembersList class="btn btn-outline btn-sm" members={group.nollor}
                >{m.nollor()}</MembersList
              >
              <MembersList
                class="btn btn-outline btn-sm"
                members={group.phaddrar.map((p) => p.member)}
                >{m.phaddrar()}</MembersList
              >
            </div></PersonCarouselItem
          >
        {/each}
      </div>
    </section>
  </div>
</article>
