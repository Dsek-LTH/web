<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as m from "$paraglide/messages";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";

  const SECTIONS = [
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
</script>

<SetPageTitle title={m.applicant()} />

{#each SECTIONS as section, i (section.title)}
  <section
    class="flex flex-col items-center gap-8 border-b-[1px] px-8 py-8 sm:px-12 md:px-16 lg:h-104 lg:flex-row lg:py-0 xl:px-36"
    class:lg:flex-row-reverse={i !== 1}
    class:bg-muted-background={i === 1}
  >
    <div class="w-[256px] shrink-0 md:w-[468px]">
      <img
        alt={section.title + " logo"}
        class="px-12 md:px-32"
        src={section.image}
      />
    </div>

    <div class="flex flex-col gap-2">
      <h2>
        {section.title}
      </h2>
      <p class="">
        {section.description}
      </p>
      <a class="mt-0" href={section.link}
        ><Button variant={section.variant} class="w-fit"
          >{m.applying_cta()}
          <ArrowRight /></Button
        ></a
      >
    </div>
  </section>
{/each}
<section
  class="flex flex-col items-center justify-around gap-8 border-b-[1px] px-8 py-8 text-center sm:px-12 md:px-16 lg:h-104 lg:flex-row lg:py-0 xl:px-36"
>
  <div class="flex flex-col items-center gap-2">
    <h2>{m.applying_student()}</h2>
    <p>
      {m.applying_student_desc()}
    </p>
    <Button class="w-fit" variant="lila" href={m.applying_student_link()}
      >{m.applying_student_cta()} <ArrowRight /></Button
    >
  </div>
  <div class="flex flex-col items-center gap-2">
    <h2>{m.applying_housing()}</h2>
    <p>
      {m.applying_housing_desc()}
    </p>
    <Button
      class="w-fit"
      variant="lila"
      href="https://www.studentlund.se/boende/"
      >{m.applying_housing_cta()} <ArrowRight /></Button
    >
  </div>
  <div class="flex flex-col items-center gap-2">
    <h2>{m.applying_studentlund()}</h2>
    <p>
      {m.applying_studentlund_desc()}
    </p>
    <Button class="w-fit" variant="lila" href="https://www.studentlund.se/"
      >studentlund.se <ArrowRight /></Button
    >
  </div>
</section>
