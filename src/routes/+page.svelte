<script lang="ts">
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { getFileUrl } from "$lib/files/client";
  import Footer from "./(app)/Footer.svelte";
  import Navbar from "./(app)/Navbar.svelte";
  import * as m from "$paraglide/messages";
  import Button from "$lib/components/ui/button/button.svelte";

  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Calendar from "@lucide/svelte/icons/calendar";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import House from "@lucide/svelte/icons/house";
  import Building from "@lucide/svelte/icons/building";
  import Heart from "@lucide/svelte/icons/heart";
  import Link from "@lucide/svelte/icons/link";

  const SECTIONS = [
    {
      title: m.landing_party_title(),
      description: m.landing_party_description(),
      cta: m.landing_party_cta(),
      icon: Calendar,
      variant: "rosa",
      images: ["party-2.jpg", "party-1.jpg", "party-3.jpg"],
      link: "/events",
    },
    {
      title: m.landing_activity_title(),
      description: m.landing_activity_description(),
      cta: m.landing_activity_cta(),
      icon: House,
      variant: "lila",
      images: ["activity-1.jpg", "activity-2.jpg", "activity-3.jpg"],
      link: "/about",
    },
    {
      title: m.landing_study_title(),
      description: m.landing_study_description(),
      cta: m.landing_study_cta(),
      icon: GraduationCap,
      variant: "pistachio",
      images: ["studies.jpg", "studies.jpg"],
      link: "/committees/srd",
    },
  ] as const;

  const ARTICLES = [
    {
      title: m.landing_companies_title(),
      description: m.landing_companies_description(),
      image: "naru.jpg",
      imagePosition: "50% 40%",
      imageSize: "125%",
      cta: m.landing_companies_cta(),
      icon: Building,
      link: "/info/for-foretag",
    },
    {
      title: m.landing_dchip_title(),
      description: m.landing_dchip_description(),
      image: "dchip.jpg",
      imagePosition: "50% 60%",
      imageSize: "250%",
      cta: m.landing_dchip_cta(),
      icon: Heart,
      link: "https://dchip.se",
    },
    {
      title: m.landing_contact_title(),
      description: m.landing_contact_description(),
      image: "studies2.jpg",
      imagePosition: "50% 80%",
      imageSize: "150%",
      cta: m.landing_contact_cta(),
      icon: Link,
      link: "/contact",
    },
  ] as const;
</script>

<nav class="contents">
  <Navbar />
</nav>
<header
  class="relative h-[90vh] bg-linear-to-t bg-[linear-gradient(to_right,rgba(0,0,0,0.9),rgba(0,0,0,0.7),rgba(0,0,0,0)),url('https://files.dsek.se/files/public/photos/hero2.jpg')] bg-cover bg-center"
>
  <div class="absolute top-1/3 px-10 lg:pl-44">
    <h1
      class="font-sans text-5xl font-bold break-keep text-white uppercase sm:mb-10 sm:text-7xl lg:text-9xl xl:text-[125px]"
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
      class="flex flex-col items-center gap-8 border-b-[1px] px-8 py-8 sm:px-12 md:px-16 lg:h-104 lg:flex-row lg:py-0 xl:px-36"
      class:lg:flex-row-reverse={i === 1}
      class:bg-muted-background={i === 1}
    >
      <Carousel.Root
        opts={{ loop: true }}
        class="shrink-0 rounded-lg shadow-lg md:w-[468px]"
      >
        <Carousel.Content class="ms-0 h-60 w-full rounded-lg md:h-80">
          {#each section.images as image, i (i)}
            <Carousel.Item class="rounded-lg ps-0">
              <img
                src={getFileUrl(`minio/files/public/photos/${image}`)}
                class="h-full w-full rounded-lg object-cover"
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

      <div class="flex flex-col gap-2">
        <h1>
          {section.title}
        </h1>
        <p class="">
          {section.description}
        </p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <a class="mt-0" href={section.link}
          ><Button variant={section.variant} class="w-fit"
            ><svelte:component this={section.icon} />{section.cta}
            <ArrowRight /></Button
          ></a
        >
      </div>
    </section>
  {/each}

  <section class="bg-muted-background flex flex-col items-center px-10 py-6">
    <div class="flex flex-col gap-8 lg:grid lg:grid-cols-3 lg:gap-16">
      {#each ARTICLES as article, i (i)}
        <article
          class="bg-background flex h-full w-[332px] flex-col rounded-md text-center"
        >
          <div
            class="w-full self-end rounded-t-md bg-[var(--url)] bg-no-repeat px-8 pt-[200px] pb-4 text-4xl font-bold uppercase"
            style:background-size={article.imageSize}
            style:background-position={article.imagePosition}
            style:background-image="url({getFileUrl(
              `minio/files/public/photos/${article.image}`,
            )})"
          ></div>
          <div
            class="flex h-full flex-col items-center rounded-b-md border-[1px] border-t-0 p-8 pt-4"
          >
            <h2>{article.title}</h2>
            <p class="mt-2 mb-3 text-left">
              {article.description}
            </p>
            <a href={article.link} class="mt-auto">
              <Button class="mt-auto w-fit"
                ><svelte:component this={article.icon} />
                {article.cta}
                <ArrowRight /></Button
              ></a
            >
          </div>
        </article>
      {/each}
    </div>
  </section>
</main>

<Footer />
