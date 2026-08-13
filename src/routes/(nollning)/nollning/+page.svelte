<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";
  import logo from "./(photos)/logo26.png";

  import veloria from "./(photos)/Pink_Panther.png";
  import knyx from "./(photos)/Pink_Panther.png";
  import ymir from "./(photos)/Pink_Panther.png";
  import nevira from "./(photos)/Pink_Panther.png";
  import orion from "./(photos)/Pink_Panther.png";
  import kryon from "./(photos)/Pink_Panther.png";
  import groupProfile from "./(photos)/Pink_Panther.png";
  import groupLandscape from "./(photos)/snostorm.jpg";
  import heavenBG from "./(photos)/bakgrund.jpg";
  import SnowEffect from "$lib/components/postReveal/SnowEffect.svelte";

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
  import tiger from "./(photos)/tigerprint-remade.webp";
  import pepp from "./(photos)/showdelapepp.png";
  import { languageTag } from "$paraglide/runtime";
  import { getFileUrl } from "$lib/files/client";

  export let data;
  let snowActive = false;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;

  const stab = [
    {
      name: "Øverphøs\nVe||oria PolarIX",
      imageUrl: veloria,
      body: "Ve||ORia PolarIX är urfrostens väktare och Stabens orubbliga kärna. När kylan svepte över Lund och frös tidens flöde, stod hon kvar i iskristallernas mitt som en ledstjärna i polarnatten. Hon bär kylan som en sköld och genom hennes kalla, klara blick hålls Staben enad i det djupaste mörker. Så länge Ve||oria vägleder från sin frosttron förblir nollan trygg och skyddad mot permafrostens osynliga vindar.",
      bodyEn: "stab",
    },
    {
      name: "Nevira Aete||na",
      imageUrl: nevira,
      body: "Ur mörka glaciärsprickor och uråldrig tjäla formar Nevira Aete||na tingens ordning. Hon väver samman materia som härdats under tusenårigt tryck och förvandlar det råa elementet till föremål med dold mening. I Neviras händer blir varje ting en länk som binder Staben till permafrostens eviga substans. Hon är den tysta kraften som ser till att allt har sin plats och att grunden aldrig ger vika.",
      bodyEn: "stab",
    },
    {
      name: "OriOn Silentíum",
      imageUrl: orion,
      body: "I permafrostens tystnad och under det flammande norrskenet vandrar OriOn Silentium. Med en blick som skär igenom täta snöbyar böjer han köldens magi för att samla överflöd och resurser från svåråtkomliga vidder. Orion är arkitekten bakom de stunder då kylan viker undan och förvandlas till strålande sammankomster, där nollans gemenskap förseglas i frostens klara sken.",
      bodyEn: "stab",
    },
    {
      name: "Kryon TiberiOS",
      imageUrl: kryon,
      body: "KryON TiberiOS är runden av norrskenets budbärare, länken mellan permafrostens kärna och världen utanför. Ur ovisshetens dimma tränger hans röst igenom som en klar fläkt av frostluft och ger vägledning åt alla sökande själar, oavsett varifrån de färdats. Med sitt obrytbara lugn raderar KryON ut all oro och väver samman nollorna till en helhet. ",
      bodyEn: "stab",
    },
    {
      name: "Ymir AmorIoT",
      imageUrl: ymir,
      body: "Sprungen ur permafrostens renaste formspråk ristar Ymir AmorIoT tidens mönster och utmaningar. Ur glaciärernas dolda djup mejslar han fram visuella symboler och prövningar skapade för att härda och förena nollorna. Genom Ymirs känsla för form blir varje skapelse ett avskalat konstverk av frusen skönhet, skapat för att bäras genom alla skeden.",
      bodyEn: "stab",
    },
    {
      name: "Knyx Gelator",
      imageUrl: knyx,
      body: "Väckt ur permafrostens djupaste skikt står Knyx Gelator som en oböjlig mur och vakar över rets gränser. För honom är kölden ett värn som skyddar och bevarar. Med ett vakande öga över alla vägar ser Knyx till att isen bär och att inga sprickor uppstår i Stabens struktur. Han bär nyckeln till tryggheten och ser till att nollan rör sig säkert över den frusna marken.",
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
      name: "Alexander",
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
      <script>
        let snowActive = $state(false);
      </script>

      <SnowEffect bind:active={snowActive} />
      <div
        class="relative mx-auto mb-12 aspect-square max-h-[500px] max-w-[500px] rounded-full border-8 border-secondary bg-[#080817] max-md:scale-75"
      >
        <div class="size-60 md:size-80">
          <img
            src={logo}
            class="absolute left-1/2 top-1/2 size-60 -translate-x-1/2 -translate-y-1/2 md:size-[480px]"
            alt="Nollning logo non-spinning"
            onclick={() => (snowActive = !snowActive)}
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
        class="absolute -inset-x-[50dvw] -inset-y-10 z-0 bg-cover bg-scroll bg-center bg-no-repeat opacity-70 md:bg-fixed"
        style={`background-image: url('${tiger}')`}
      ></div>
      <div class="relative z-10 mb-4 flex justify-center">
        <img
          src={pepp}
          alt="Show de la pepp logga"
          class="relativez -10 h-64 w-64 object-cover md:h-[480px] md:w-[480px]"
        />
      </div>
      <h1
        class="relative z-10 mb-4 p-2 text-center font-nolla-pepp text-5xl leading-loose tracking-widest text-[#ffb800] md:text-8xl"
        style="-webkit-text-stroke: 5px #ff3347; line-height: 1.2;"
      >
        Show De<br />La Pepp
      </h1>
      <div class="-mt-20 w-full scroll-m-20 pt-20">
        <div
          class="mx-auto grid max-w-md grid-cols-2 justify-items-center gap-8 md:max-w-lg"
        >
          {#each peppers.slice(0, 2) as pepper, index (pepper.name)}
            <PersonCarouselItem
              name={pepper.name}
              {index}
              imageUrl={pepper.imageUrl}
              body={languageTag() === "en" ? pepper.bodyEn : pepper.body}
            />
          {/each}
        </div>
        <div class="mt-4 grid grid-cols-3 gap-8">
          {#each peppers.slice(2) as pepper, index (pepper.name)}
            <PersonCarouselItem
              name={pepper.name}
              index={index + 2}
              imageUrl={pepper.imageUrl}
              body={languageTag() === "en" ? pepper.bodyEn : pepper.body}
            />
          {/each}
        </div>
      </div>
    </section>
    {#if data.revealTheme}
      <iframe
        class="aspect-video w-full"
        src="https://www.youtube.com/embed/rRPQs_kM_nw"
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
