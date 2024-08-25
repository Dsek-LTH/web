<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";
  import alexander from "./(photos)/alexander.webp";
  import axel from "./(photos)/axel.webp";
  import casper from "./(photos)/casper.webp";
  import emil from "./(photos)/emil.webp";
  import gustaf from "./(photos)/gustaf.webp";
  import jacob from "./(photos)/jacob.webp";
  import klara from "./(photos)/klara.webp";
  import linn from "./(photos)/linn.webp";
  import lola from "./(photos)/lola.webp";
  import thyra from "./(photos)/thyra.webp";
  import wilma from "./(photos)/wilma.webp";
  import { languageTag } from "$paraglide/runtime";

  export let data;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;

  const peppers = [
    {
      name: "Sasha",
      imageUrl: alexander,
      body: `Howdy howdy!!\n\nAlexander heter jag aka Sasha aka Mami! Jag är Øverpeppare i år tillsammans med Thyra. Jag har varit med om 24 snurrar runt solen och är från Lund!! Jag börjar nu mitt tredje år på InfoCom.\n\nMitt tips till er är - njut av resan och släpp loss på saloonen!! Ingen cowboy lever bara för plugget. Se till att också ha roligt!!\n\nHasta la vista!`,
      bodyEn:
        "Howdy howdy!!\n\nMy name is Alexander aka Sasha aka Mami! I'm a Head Pepper this year together with Thyra. I've been around the sun 24 times and I'm from Lund!! I'm now starting my third year in InfoCom.\n\nMy tip for you is - enjoy the journey and let loose at the saloon!! No cowboy lives just for studying. Make sure to have fun too!!\n\nHasta la vista!",
    },
    {
      name: "Thyra",
      imageUrl: thyra,
      body: `Tjenixen! Jag heter Thyra och är Øverpeppare tillsammans med Sasha <3. Jag är 22 år gammal, kommer ursprungligen från gamla fina Örebro och ska nu börja mitt tredje år på data.\n\nAlla äventyr som n0llningen erbjuder måste ju självklart ha ett soundtrack. Mitt tips är därför en riktigt najs spellista som får dig peppad och redo för dagen! Vi hörs!`,
      bodyEn:
        "Hey there! My name is Thyra and I'm a Head Pepper together with Sasha <3. I'm 22 years old, originally from the lovely old Örebro, and I'm about to start my third year in computer science.\n\nAll the adventures that n0llningen offers definitely need a soundtrack. So my tip is to create a really nice playlist that gets you pumped and ready for the day! See you around!",
    },
    {
      name: "Axel",
      imageUrl: axel,
      body: `Hej kompisar! Jag är Axel Magnusson, stockholmare, 25 år jättegammal och sedan ett år tillbaka blivande Civilingenjör i Datateknik! Mitt bästa tips för att inte ramla av hästen under nollningen är att välja sina dueller. Även den tuffaste av cowboys måste vila upp sig ibland - man kan inte galoppera utan sömn! `,
      bodyEn:
        "Hey friends! I'm Axel Magnusson, a 25-year-old Stockholm native, and soon-to-be Master of Science in Computer Engineering! My best tip to avoid falling off the horse during nollningen is to pick your battles. Even the toughest cowboys need to rest sometimes - you can't gallop without sleep!",
    },
    {
      name: "Klara",
      imageUrl: klara,
      body: `Hej!\n\nKlara här, 24 år, men det är så många andra snygga Klaror här på sektionen så Högen/Högis går också bra. Är från en liten ö i Stockholm (Södermalm) men pluggar nu trean på InfoCom.\n\nFör att stå stadigt i stövlarna är mitt tips att alla här är lika sugna på att lära känna nya människor -  så våga ta första steget och fyll din flock med andra cowboys!`,
      bodyEn:
        "Hi!\n\nKlara here, 24 years old, but since there are so many other good-looking Klaras in the guild, you can also call me Högen/Högis. I'm from a small island in Stockholm (Södermalm) but now I'm in my third year in InfoCom.\n\nTo stay steady in your boots, my tip is that everyone here is just as eager to meet new people - so don't be afraid to take the first step and fill your group with other cowboys!",
    },
    {
      name: "Casper",
      imageUrl: casper,
      body: `Hallojsan framtida vänner! Casper va namnet, 21 år gammal från härliga Stockholm, Nacka o ska börja andra året på data här i Lund😵 Jag rekommenderar starkt att hitta en stabil plats o slå läger när man ska plugga. Det finns många vilda cowboys här på campus så konkurrensen är tuff. Om du inte vet vart du kan sitta så kan du alltid fråga mig! 📚🤠`,
      bodyEn:
        "Hey there future friends! The name's Casper, 21 years old from the lovely Stockholm, Nacka, and about to start my second year in computer science here in Lund😵 I highly recommend finding a stable spot to set up camp when you're studying. There are a lot of wild cowboys here on campus so competition is tough. If you don't know where to sit, you can always ask me! 📚🤠",
    },
    {
      name: "Wilma",
      imageUrl: wilma,
      body: `Tja!\n\nWilma heter jag, är en 20 årig andraårsstudent på data och kommer (tyyyyyp) från Stockholm!!\n\nHär i vilda västern kan det vara svårt för en nybliven cowboy att hitta rätt. Mitt bästa tips är därför att fråga alla rutinerade studenter om allt möjligt: vilka böcker som inte behövs, vilken nation som de gillar mest, eller vart man hittar Lunds bästa falafel. Ha så kul, kram!!`,
      bodyEn:
        "Hey!\n\nMy name is Wilma, I'm a 20-year-old second-year computer science student and I'm (tyyyyyp) from Stockholm!!\n\nHere in the wild west, it can be hard for a new cowboy to find their way. My best tip is to ask all the experienced students about anything: which books you don't need, which nation they like the most, or where to find the best falafel in Lund. Have fun, hugs!!",
    },
    {
      name: "Emil",
      imageUrl: emil,
      body: `Howdy!\n\nEmil heter jag, kallas även Nubben, är 27 år gammal och kommer från Borås. Går nu mitt sjätte år på InfoCom! För att just du ska ha en fantastisk nollning i västern så är mitt främsta tips att våga bjuda på er själva lite extra under nollningen! Det är så man hittar sina framtida studiecowboys och något man kommer ha kvar för livet <3`,
      bodyEn:
        "Howdy!\n\nMy name is Emil, also known as Nubben, I'm 27 years old and from Borås. I'm now in my sixth year in InfoCom! For you to have an amazing nollning in the west, my top tip is to dare to put yourself out there a little extra during nollningen! That's how you find your future study cowboys, and it's something you'll have for life <3",
    },
    {
      name: "Linn",
      imageUrl: linn,
      body: `Heej där!\n\nLinn heter jag, är 21 bast från Täby och nu glider jag in i andra året på InfoCom!!\n\nNär man ridit genom ett blåsigt vilda västern, är det skönt att ha laddat upp med färdiglagade matlador. Kanske testa cowboysopp`,
      bodyEn:
        "Hey there!\n\nMy name is Linn, I'm 21 years old from Täby and now I'm sliding into my second year in InfoCom!!\n\nWhen you've ridden through a windy wild west, it's nice to have stocked up on pre-prepared meals. Maybe try cowboy stew?",
    },
    {
      name: "Gustaf",
      imageUrl: gustaf,
      body: `Tja! Det är jag som är Gustaf JensEn och jag är en peppande cowboy som ibland pluggar Data, numera år 3! Innan jag red ned till Lund härjade jag på sumpans gator i Stockholm!\n\nEn cowboy ska veta sina begränsningar! Åk därför inte Voi på vargtimmen, vi glömmer aldrig våra fallna bröder som vaknat upp på sjukan med en extra donation till tandfen.`,
      bodyEn:
        "Hey! I'm Gustaf Jensen, and I'm a peppy cowboy who sometimes studies computer science, now in year 3! Before I rode down to Lund, I roamed the streets of Sundbyberg in Stockholm!\n\nA cowboy should know their limits! So don't ride a Voi scooter at the wolf hour; we'll never forget our fallen brothers who woke up in the hospital with an extra donation to the tooth fairy.",
    },
    {
      name: "Lola",
      imageUrl: lola,
      body: `Hej hej!\n\nLola heter jag (Aurora är mitt goverment name men vi skiter i det). Jag är en hela 21 år gammal, är från Malmö och går mitt fjärde år på data( klarar du första året så har du redan mer HP än mig).  \n\nMitt bästa tips för att bli en stabil cowboy är att försök att undvika sista minuten tenta-plugget, tänk på hur många fler saloons man kan gå på medan alla andra omtenta pluggar!`,
      bodyEn:
        "Hey hey!\n\nMy name is Lola (Aurora is my government name but let's not worry about that). I'm a whole 21 years old, from Malmö, and I'm in my fourth year in computer science (if you survive the first year, you've already earned more credits than I have).\n\nMy best tip for becoming a stable cowboy is to try to avoid last-minute exam cramming, think about how many more saloons you can visit while everyone else is cramming for retakes!",
    },
    {
      name: "Jacobi",
      imageUrl: jacob,
      body: `Hallå ja!\nJacob heter jag, men kalla mig gärna för Jacobi. Jag är 23 år och går tredje året på InfoCom.\nEtt tips för att lätt kunna Gallopera genom nollningen är att ha en fungerande cykel. Då går det mycket snabbare att komma fram till eventen, men även att komma hem för att få så mycket välbehövlig vila som möjligt.`,
      bodyEn:
        "Hello there! My name is Jacob, but feel free to call me Jacobi. I'm 23 years old and in my third year in InfoCom.\nA tip for easily galloping through nollningen is to have a functioning bike. That way, you'll get to events much faster and can get home quickly for some much-needed rest.",
    },
  ];
</script>

<SetPageTitle title="Nollning" />

<article class="space-y-16">
  {#if data.revealTheme}
    <div
      class="-mx-6 -my-6"
      style={`height: calc(100dvh - ${data.isApp ? headerAndFooterHeight : 0}px)`}
    >
      <figure
        class="relative h-full w-full overflow-hidden border-none bg-neutral"
      >
        <!-- todo: change image (also have two vers for landscape/profile) -->
        <img
          src="https://www.dsek.se/hero-image.webp"
          alt="Hero"
          class="h-full w-full object-cover"
        />
        <span
          class="absolute left-1/2 top-1/2 w-max max-w-screen-md -translate-x-1/2 -translate-y-1/2 transform px-4 text-center font-nolla-stab text-5xl leading-snug md:text-8xl"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.nollning_title()}
        </span>
      </figure>
    </div>
  {/if}
  <!-- limit width and center -->
  <div class="mx-auto max-w-screen-md">
    {#if data.revealTheme}
      <section class="flex flex-col">
        <h3 class="page-title text-secondary">
          {m.nollning_landing_hello_title()}
        </h3>
        <p class="nolla-prose">
          {m.nollning_landing_hello_body()}
        </p>
        <a href="#staben" class="btn-primary-dark btn self-center"
          >{m.nollning_landing_view_staben()}</a
        >
      </section>
      <section>
        <h3 class="page-title font-nolla-stab !text-2xl text-secondary">
          {m.nollning_landing_lore_title()}
        </h3>
        <p class="nolla-prose">
          {m.nollning_landing_lore_body()}
        </p>
      </section>

      <section class="!my-32 !mb-48 flex flex-col items-center" id="staben">
        <div
          class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
        >
          <PersonCarouselItem
            stab
            name={`Øverphøs\nArux Tonitribus`}
            index={0}
          />
          <PersonCarouselItem stab name="ImRe Daemon" index={1} />
          <PersonCarouselItem stab name="Volto RefacTor" index={2} />
          <PersonCarouselItem stab name="Lostrego MutatI/O" index={3} />
          <PersonCarouselItem stab name="Macro Tempestas" index={4} />
          <PersonCarouselItem stab name="Celesta VentUX" index={5} />
        </div>
      </section>
    {/if}

    <section
      class="!mb-48 flex flex-col items-center"
      id="peppers"
      class:!mt-32={data.revealTheme}
    >
      <div
        class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
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

    <section class="flex flex-col">
      <h3 class="page-title mb-4 text-secondary">
        {m.nollning_landing_policy_header()}
      </h3>
      <p class="nolla-prose">
        {m.nollning_landing_policy_subtitle()}
      </p>
      <ul class="list-disc leading-relaxed">
        <li>{m.nollning_landing_policy_lines_1()}</li>
        <li>{m.nollning_landing_policy_lines_2()}</li>
        <li>{m.nollning_landing_policy_lines_3()}</li>
        <li>
          {m.nollning_landing_policy_lines_4()}
        </li>
      </ul>
      {#if data.revealTheme}
        <p class="nolla-prose">
          {m.nollning_landing_policy_readMore()}
        </p>
        <!-- TODO: Link -->
        <a href="/" class="btn-primary-dark btn self-center"
          >{m.nollning_landing_policy_read()}</a
        >
      {/if}
    </section>

    <!-- TODO: Phaddergrupper -->
    <section class="mt-16 flex flex-col items-center" id="peppers">
      <div
        class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
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
