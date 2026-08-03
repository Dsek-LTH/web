<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";
  import logo from "./(photos)/Pink_Panther.png";

  import veloria from "./(photos)/Pink_Panther.png";
  import knyx from "./(photos)/Pink_Panther.png";
  import ymir from "./(photos)/Pink_Panther.png";
  import nevira from "./(photos)/Pink_Panther.png";
  import orion from "./(photos)/Pink_Panther.png";
  import kryon from "./(photos)/Pink_Panther.png";
  import groupProfile from "./(photos)/Pink_Panther.png";
  import groupLandscape from "./(photos)/bakgrund.jpg";
  import heavenBG from "./(photos)/Pink_Panther.png";

  import oscar from "./(photos)/showdelapepp.png";
  import vincent from "./(photos)/showdelapepp.png";
  import clara from "./(photos)/showdelapepp.png";
  import frida from "./(photos)/showdelapepp.png";
  import isac from "./(photos)/showdelapepp.png";
  import ella from "./(photos)/showdelapepp.png";
  import alexander from "./(photos)/showdelapepp.png";
  import love from "./(photos)/showdelapepp.png";
  import alva from "./(photos)/showdelapepp.png";
  import anna from "./(photos)/showdelapepp.png";
  import hilda from "./(photos)/showdelapepp.png";
  import tiger from "./(photos)/tigerprints.png";
  import { languageTag } from "$paraglide/runtime";
  import { getFileUrl } from "$lib/files/client";

  export let data;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;

  const stab = [
    {
      name: "Øverphøs\nVe||oria PolarIX",
      imageUrl: veloria,
      body: "stab",
      bodyEn: "stab",
    },
    {
      name: "Nevira Aete||na",
      imageUrl: nevira,
      body: "stab",
      bodyEn: "stab",
    },
    {
      name: "OriOn Silentíum",
      imageUrl: orion,
      body: "stab",
      bodyEn: "stab",
    },
    {
      name: "Kryon TiberiOS",
      imageUrl: kryon,
      body: "stab",
      bodyEn: "stab",
    },
    {
      name: "Ymir AmorIoT",
      imageUrl: ymir,
      body: "stab",
      bodyEn: "stab",
    },
    {
      name: "Knyx Gelator",
      imageUrl: knyx,
      body: "stab",
      bodyEn: "stab",
    },
  ];

  const peppers = [
    {
      name: "Vincent",
      imageUrl: vincent,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Alva",
      imageUrl: alva,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Oscar",
      imageUrl: oscar,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Ella",
      imageUrl: ella,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Alexandra",
      imageUrl: alexander,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Hilda",
      imageUrl: hilda,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Isac",
      imageUrl: isac,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Clara",
      imageUrl: clara,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Anna",
      imageUrl: anna,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Frida",
      imageUrl: frida,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
    {
      name: "Love",
      imageUrl: love,
      body: `lorum ipsum`,
      bodyEn: `lorum ipsum`,
    },
  ];
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
          style="background-image: url('{groupProfile}'); box-shadow: inset 0 -100px 100px -100px #E6D3B1;"
        ></div>
        <div
          class="hidden h-full w-full bg-cover bg-center bg-no-repeat max-md:bg-scroll md:block md:bg-fixed"
          style="background-image: url('{groupLandscape}'); box-shadow: inset 0 -100px 75px -100px #E6D3B1;"
        ></div>

        <span
          class="absolute inset-x-4 bottom-10 hidden max-w-full transform text-center font-nolla-stab text-7xl leading-snug text-base-100 text-stroke-secondary text-stroke-6 md:block lg:text-8xl"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.nollning_title().replace("\n", " ")}
        </span>
        <span
          class="absolute inset-x-4 bottom-10 max-w-full transform text-center font-nolla-stab text-5xl leading-snug text-base-100 text-stroke-secondary text-stroke-6 md:hidden md:text-8xl"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.nollning_title().replace("\n", "<br />")}
        </span>
      </figure>
    </div>
  {/if}
  <!-- limit width and center -->
  <div class="mx-auto max-w-screen-md">
    <section class="flex flex-col">
      <h3 class="page-title !text-3xl text-secondary">
        {m.nollning_landing_hello_title()}
      </h3>
      <p class="nolla-prose">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.nollning_landing_hello_body()}
      </p>
    </section>

    <section class="mb-12 mt-8 flex flex-col">
      <h3 class="page-title mb-4 !text-3xl text-secondary">
        {m.nollning_landing_policy_header()}
      </h3>
      <p class="nolla-prose">
        {m.nollning_landing_policy_subtitle()}
      </p>
      <ul class="list-inside list-disc leading-relaxed">
        <li>{m.nollning_landing_policy_lines_1()}</li>
        <li>{m.nollning_landing_policy_lines_2()}</li>
        <li>{m.nollning_landing_policy_lines_3()}</li>
        <li>
          {m.nollning_landing_policy_lines_4()}
        </li>
      </ul>
      <p class="nolla-prose">
        {m.nollning_landing_policy_readMore()}
      </p>
      <div>
        <a
          href={getFileUrl(
            `minio/files/public/miscellaneous/rights-sv-2025.pdf`,
          )}
          class="{data.revealTheme
            ? 'btn-secondary-beige'
            : 'btn-primary-dark'}  btn self-start"
          >{m.nollning_landing_policy_read()}</a
        >
        <a
          href={"http://bit.ly/trivselkontakt"}
          class="{data.revealTheme
            ? 'btn-secondary-beige'
            : 'btn-primary-dark'} btn mt-2 self-start"
          >{m.home_contactWellbeing()}</a
        >
      </div>
    </section>
    {#if data.revealTheme}
      <div
        class="relative mx-auto mb-12 aspect-square max-h-[420px] max-w-[420px] rounded-full border-8 border-secondary bg-[#1f1f1c] max-md:scale-75"
      >
        <div class="size-60 md:size-80">
          <img
            src={logo}
            class="absolute left-1/2 top-1/2 size-60 -translate-x-1/2 -translate-y-1/2 md:size-80"
            alt="Nollning logo non-spinning"
          />
        </div>
      </div>
      <section>
        <h3 class="page-title font-nolla-stab !text-4xl text-secondary">
          {m.nollning_landing_lore_title()}
        </h3>
        <p class="nolla-prose">
          {m.nollning_landing_lore_body()}
        </p>
        <!-- <iframe waiting for final video src
          class="aspect-video w-full"
          src=""
          title="Reveal film"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe> -->
      </section>

      <section
        class="relative !my-16 !mb-20 flex min-h-dvh flex-col items-center"
        id="staben"
      >
        <div
          class="absolute -inset-x-[50dvw] -inset-y-10 z-0 bg-cover bg-center bg-no-repeat opacity-30 max-md:bg-scroll md:bg-fixed"
          style={`background-image: url('${heavenBG}')`}
        ></div>
        <h1
          class="z-10 mb-4 rounded-btn p-2 text-center font-nolla-stab text-8xl tracking-wider md:text-9xl"
        >
          Staben
        </h1>
        <div
          class="z-0 -mt-20 w-full scroll-smooth bg-transparent pt-20 max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
        >
          {#each stab as stab, index}
            <PersonCarouselItem
              stab
              name={stab.name}
              {index}
              imageUrl={stab.imageUrl}
              body={languageTag() === "en" ? stab.bodyEn : stab.body}
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
        class="absolute -inset-x-[50dvw] -inset-y-10 -z-0 opacity-30 bg-repeat-space max-md:bg-[length:30rem] max-md:bg-scroll md:bg-[length:40rem] md:bg-fixed"
        style={`background-image: url('${tiger}')`}
      ></div>
      <h1
        class="z-10 mb-4 p-2 text-center font-nolla-pepp text-5xl tracking-widest text-[#F280A1] text-stroke-gray text-stroke-4 max-md:text-stroke-2 md:text-8xl"
      >
        Show De La Pepp
      </h1>
      <div
        class="-mt-20 w-full scroll-m-20 pt-20 max-md:carousel max-md:!flex md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
      >
        {#each peppers as pepper, index (pepper.name)}
          <PersonCarouselItem
            name={pepper.name}
            {index}
            imageUrl={pepper.imageUrl}
            body={languageTag() === "en" ? pepper.bodyEn : pepper.body}
          />
        {/each}
      </div>
    </section>
    {#if data.revealTheme}
      <iframe
        class="aspect-video w-full"
        src="https://www.youtube.com/embed/njDZ3X2rscQ"
        title="Nolledans film"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    {/if}
    <section class="mt-16 flex flex-col items-center">
      <h1 class="mb-16 text-3xl font-medium">
        {m.phadderGroups()}
      </h1>
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
              <MembersList
                class="btn btn-outline btn-sm "
                members={group.nollor}>{m.nollor()}</MembersList
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
