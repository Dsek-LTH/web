<script lang="ts">
  import { Building, GraduationCap } from "@lucide/svelte";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { getFileUrl } from "$lib/files/client";
  import Footer from "./(app)/Footer.svelte";
  import Navbar from "./(app)/Navbar.svelte";
  import * as m from "$paraglide/messages";
  import Button from "$lib/components/ui/button/button.svelte";

  const SECTIONS = [
    {
      title: m.landing_party_title(),
      slogan: m.landing_party_slogan(),
      description: m.landing_party_description(),
      images: ["party-1.jpg", "party-2.jpg", "party-3.jpg"],
    },
    {
      title: m.landing_activity_title(),
      slogan: m.landing_activity_slogan(),
      description: m.landing_activity_description(),
      images: ["activity-1.jpg", "activity-2.jpg", "activity-3.jpg"],
    },
  ] as const;

  const ARTICLES = [
    {
      title: m.landing_guild_title(),
      description: m.landing_guild_description(),
      image: "guild.jpg",
      imagePosition: "50% 40%",
      imageSize: "125%",
    },
    {
      title: m.landing_study_title(),
      description: m.landing_study_description(),
      image: "studies.jpg",
      imagePosition: "50% 0%",
      imageSize: "150%",
    },
    {
      title: m.landing_dchip_title(),
      description: m.landing_dchip_description(),
      image: "dchip.jpg",
      imagePosition: "50% 80%",
      imageSize: "250%",
    },
  ] as const;
</script>

<nav class="contents">
  <Navbar />
</nav>
<header
  class="relative h-screen bg-linear-to-t bg-[linear-gradient(to_top,rgba(0,0,0,1),rgba(0,0,0,0.7),rgba(0,0,0,0)),url('https://files.dsek.se/files/public/photos/hero.jpg')] bg-cover bg-center"
>
  <div class="absolute top-1/3 px-10 lg:pl-44">
    <h1
      class="mb-10 font-sans text-5xl font-bold text-white uppercase lg:text-9xl xl:text-[125px]"
    >
      {m.dsektionen()}
    </h1>
    <p class="mb-10 max-w-prose font-medium text-white lg:mb-9 lg:text-xl">
      {m.landing_intro()}
    </p>

    <div
      class="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-10"
    >
      <Button href="/sokande" size="lg" class="text-lg">
        <GraduationCap class="size-6" />{m.landing_forStudents()}
      </Button>
      <Button
        href="/info/for-foretag"
        size="lg"
        class="hover:bg-secondary-background/30 text-lg text-white"
        variant="outline"
      >
        <Building class="size-6" />{m.home_forCompanies()}
      </Button>
    </div>
  </div>
</header>

<main class="flex flex-col gap-2">
  {#each SECTIONS as section, i (section.title)}
    <section
      class="flex w-full flex-col lg:flex-row"
      class:lg:flex-row-reverse={i === 1}
    >
      <Carousel.Root opts={{ loop: true }} class="lg:w-3/5">
        <Carousel.Content class="ms-0 h-80 w-full lg:h-[500px]">
          {#each section.images as image, i (i)}
            <Carousel.Item class="ps-0">
              <img
                src={getFileUrl(`minio/files/public/photos/${image}`)}
                class="h-full w-full object-cover"
                alt="party"
              />
            </Carousel.Item>
          {/each}
        </Carousel.Content>
        <Carousel.Previous
          class="hover:bg-secondary-background/30 ml-16 size-10 text-white"
        />
        <Carousel.Next
          class="hover:bg-secondary-background/30 mr-16 size-10 text-white"
        />
      </Carousel.Root>

      <div
        class="text-md flex flex-col px-10 lg:w-2/5 lg:items-start lg:gap-7 lg:px-16 xl:px-24"
      >
        <h2 class="pt-6 text-xl font-bold uppercase lg:text-2xl xl:text-3xl">
          {section.title}
        </h2>
        <h1
          class="text-4xl font-bold text-balance uppercase lg:text-left lg:text-5xl xl:text-6xl"
        >
          {section.slogan}
        </h1>
        <p class="mb-8 max-w-prose text-sm font-medium lg:text-lg xl:text-xl">
          {section.description}
        </p>
      </div>
    </section>
  {/each}

  <section class="mx-10 mt-6 flex flex-col items-center">
    <h2 class="mb-8 text-center font-bold uppercase lg:text-3xl">
      {m.landing_community_title()}
    </h2>
    <div
      class="flex flex-col gap-x-14 lg:grid lg:w-5/6 lg:grid-flow-col lg:grid-cols-3 lg:grid-rows-2 lg:gap-y-0"
    >
      {#each ARTICLES as article, i (i)}
        <article class="contents">
          <h1
            class="w-full self-end bg-[linear-gradient(180deg,transparent_0%,var(--muted-background)_85%),var(--url)] bg-no-repeat px-8 pt-[200px] pb-4 text-4xl font-bold uppercase"
            style:background-size={article.imageSize}
            style:background-position={article.imagePosition}
            style:--url="url({getFileUrl(
              `minio/files/public/photos/${article.image}`,
            )})"
          >
            {article.title}
          </h1>
          <p
            class="bg-muted-background mt-0 mb-6 w-full max-w-prose px-8 pb-6 text-sm font-medium lg:pb-0 lg:text-base"
          >
            {article.description}
          </p>
        </article>
      {/each}

      <!-- <article
        class="flex flex-col items-center justify-end gap-5 bg-[linear-gradient(180deg,transparent_0%,var(--muted-background)_50%),var(--url)] bg-no-repeat px-8 py-[50px] pt-[200px]"
        style:background-size={article.imageSize}
        style:background-position={article.imagePosition}
        style:--url="url({getFileUrl(
          `minio/files/public/photos/${article.image}`,
        )})"
      >
        <h1 class="text-4xl font-bold uppercase">
          {article.title}
        </h1>
        <p
          class="max-w-prose text-sm font-medium lg:max-w-[300px] lg:text-base"
        >
          {article.description}
        </p>
      </article> -->
    </div>
  </section>
</main>

<Footer />
