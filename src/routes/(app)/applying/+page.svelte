<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getFileUrl } from "$lib/files/client";
  import * as m from "$paraglide/messages";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";

  const PROGRAMMES = [
    {
      title: m.applying_datateknik(),
      description: m.applying_datateknik_desc(),
      variant: "rosa",
      image:
        "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/datateknik/color.svg",
      link: "https://www.lth.se/utbildning/datateknik300/",
    },
    {
      title: m.applying_infocom(),
      description: m.applying_infocom_desc(),
      variant: "lila",
      image:
        "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/infocom/color.svg",
      link: "https://www.lth.se/utbildning/informations-och-kommunikationsteknik/",
    },
    {
      title: m.applying_vrar(),
      description: m.applying_vrar_desc(),
      variant: "pistachio",
      image:
        "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/vr_ar/color.svg",
      link: "https://www.lunduniversity.lu.se/lubas/i-uoh-lu-TAVAR",
    },
  ] as const;

  const INFOS = [
    {
      title: m.applying_student(),
      description: m.applying_student_desc(),
      link: m.applying_student_link(),
      cta: m.applying_student_cta(),
      variant: "rosa" as const,
      image: getFileUrl("minio/files/public/photos/studies3.webp"),
    },
    {
      title: m.applying_housing(),
      description: m.applying_housing_desc(),
      link: "https://www.studentlund.se/boende/",
      cta: m.applying_housing_cta(),
      variant: "lila" as const,
      image:
        "https://afbostader.se/globalassets/bostadsomraden/hippocampus/br_hc_ff.jpg",
    },
    {
      title: m.applying_studentlund(),
      description: m.applying_studentlund_desc(),
      link: "https://www.studentlund.se/",
      cta: "studentlund.se",
      variant: "rosa" as const,
      image:
        "https://www.studentlund.se/wp-content/uploads/2023/02/Kopia-av-AFborgen42_ljus_crop-kopia-2.jpg",
    },
  ];
</script>

<SetPageTitle title={m.applicant()} />

{#each PROGRAMMES as programme, i (programme.title)}
  <section
    class="flex flex-col items-center gap-8 border-b-[1px] px-8 py-8 sm:px-12 md:px-16 lg:h-104 lg:flex-row lg:py-0 xl:px-36"
    class:lg:flex-row-reverse={i !== 1}
    class:bg-muted-background={i === 1}
  >
    <div class="w-[256px] shrink-0 md:w-[468px]">
      <img
        alt={programme.title + " logo"}
        class="px-12 md:px-32"
        src={programme.image}
      />
    </div>

    <div class="flex flex-col gap-2">
      <h2>
        {programme.title}
      </h2>
      <p class="">
        {programme.description}
      </p>
      <a class="mt-0" href={programme.link}
        ><Button variant={programme.variant} class="w-fit"
          >{m.applying_cta()}
          <ArrowRight /></Button
        ></a
      >
    </div>
  </section>
{/each}
<section
  class="flex flex-col items-center justify-around gap-8 px-8 py-8 text-center sm:px-12 md:px-16 lg:flex-row lg:py-0 xl:px-36"
>
  {#each INFOS as info (info.title)}
    <div
      class="flex flex-col items-center gap-2 border-b-[1px] py-8 lg:border-0"
    >
      <div
        class="bg-muted-background mt-4 h-56 w-84 rounded-lg bg-cover bg-center"
        style:background-image={`url("${info.image}")`}
      ></div>
      <h2 class="mt-2">{info.title}</h2>
      <p class="mt-0 w-84">
        {info.description}
      </p>
      <Button class="w-fit" variant={info.variant} href={info.link}
        >{info.cta} <ArrowRight /></Button
      >
    </div>
  {/each}
</section>
