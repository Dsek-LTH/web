<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";
  import logo from "./(photos)/logo25.svg";

  import zenit from "./(photos)/zenit.webp";
  import stellara from "./(photos)/stellara.webp";
  import lumos from "./(photos)/lumos.webp";
  import astra from "./(photos)/astra.webp";
  import axioma from "./(photos)/axioma.webp";
  import atlas from "./(photos)/atlas.webp";
  import groupProfile from "./(photos)/staben25_9x16.webp";
  import groupLandscape from "./(photos)/staben25_16x9.webp";
  import heavenBG from "./(photos)/heaven_bg.webp";

  import william from "./(photos)/william.webp";
  import theo from "./(photos)/theo.webp";
  import simon from "./(photos)/simon.webp";
  import david from "./(photos)/david.webp";
  import abbe from "./(photos)/abbe.webp";
  import louise from "./(photos)/louise.webp";
  import carl from "./(photos)/carl.webp";
  import edwin from "./(photos)/edwin.webp";
  import hannah from "./(photos)/hannah.webp";
  import astrid from "./(photos)/astrid.webp";
  import wilma from "./(photos)/wilma.webp";
  import infinity from "./(photos)/infinity.svg";
  import { languageTag } from "$paraglide/runtime";

  export let data;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;

  const stab = [
    {
      name: "Øverphøs\nZenIT AeonIX",
      imageUrl: zenit,
      body: `ZenIT Aeonix är Stabens beskyddare, född ur ljusets sken för att vaka över n0llningen. När stormen länge härjade i Lund stod ZenIT orubblig genom dess prövningar och genom hans närvaro förblev Staben intakt. Han är den pelare som bär tyngden av allt som är och skall bli. Så länge ZenIT finns kvar, kvarstår den trygghet som leder n0llan hem.`,
      bodyEn:
        "ZenIT Aeonix, is the guardian of Staben, born from light to watch over n0llningen. When the storm long raged over Lund, ZenIT stood unyielding through its trials and through his presence, Staben remained intact. He is the pillar that bears the weight of all that is and shall be. As long as ZenIT endures, the safety that guides n0llan home shall remain.",
    },
    {
      name: "Astra NebulUX",
      imageUrl: astra,
      body: `Astra NebulUX väver materia och ting till enhet, och i tystnaden arbetar hon för att förena Staben i en gemensam vision. Genom uråldrig kunskap förvandlar hon form till mening där varje element bär på en dold sanning. I Astras händer blir varje skapelse ett uttryck för Stabens manifestation. Hon och hennes vision är förbindelsen mellan det synliga och det eviga.`,
      bodyEn:
        "Astra NebulUX weaves matter and things into unity, and in silence, the works to unite Staben in a shared vision. Through ancient knowledge, she transforms form into meaning where every element carries a hidden truth. In Astra’s hands, every creation becomes a manifestation of Staben’s essence. She and her vision is the connection between the visible and the eternal.",
    },
    {
      name: "AxI/Oma Solariz",
      imageUrl: axioma,
      body: `I de allra yttersta lagren av himlavalvet, vävdes AxI/Oma Solariz ur stjärnstoft. Hon har nu trätt ner i jordens rum för att forma n0llningens himmelska tillställningar. Genom kosmiska krafter och ceremoniell magi skapar hon ögonblick där glädje och gemenskap förseglas i stjärnornas ljus. Under hennes blick tar n0llningens form gestalt.`,
      bodyEn:
        "In the outermost layers of the celestial vault, AxI/Oma Solariz was woven from stardust. She has now descended into the earthly realm to shape the heavenly gatherings of n0llningen. Through cosmic power and ceremonial magic, she creates moments where joy and fellowship are sealed in the light of the stars. Under her watchful gaze, the n0llning takes shape.",
    },
    {
      name: "Λtlαs EteriON",
      imageUrl: atlas,
      body: `I himlarikets väldiga arkiv vandrar en själ vars blick ser bortom det synliga. Atlas Eterion, Stabens kompass, vägleder gruppen genom himlavalvet. Han söker inte bara efter vägen till ljusets domäner, utan även stigarna som leder till rikedom och överflöd. Till sin hjälp böjer Atlas ljusets kraft för att skapa magiska artifakter åt n0llan och Staben, föremål ämnade till att möjliggöra n0llningen.`,
      bodyEn:
        "Within the vast archives of the celestial realm, wanders a soul whose gaze pierces through the visible. Atlas Eterion, Staben’s compass guides the group through the heavens. He seeks not only the path to light but also the trails that lead to wealth and abundance. With his aid, Atlas bends the power of light to create magical artifacts for n0llan and Staben, items destined to make n0llningen possible.",
    },
    {
      name: "LumOS Kernael",
      imageUrl: lumos,
      body: `LumOS Kernael väcktes ur himlavalvets oändligt sträckande ljus, där han nu vakar som domänens evige väktare. Med klarhet i varje steg och ljuset som sin följeslagare, säkerställer han att inga korruptioner gömmer sig bakom stormens moln. I sin hand bär han nyckeln som försvarar alla phaddrar och låter n0llorna tryggt finna sin väg.`,
      bodyEn:
        "LumOS Kernael was awakened from the endlessly stretching light of the celestial vault, where he now watches as the eternal guardian of the domain. With clarity in every step and the light as his companion, he ensures that no corruptions hide behind the storm’s clouds. In his hand he carries the key that defends all phaddrar and allows the n0llor to safely find their way.",
    },
    {
      name: "Ste||ara Venvelia",
      imageUrl: stellara,
      body: `Stellara Venvelia är länken mellan stjärnorna och n0llan. Utsänd från himlavalvets sfär vandrar hon bland n0llorna som Stabens röst. Genom sina klara budskap och varsamma kraft, vägleder Stellara n0llan genom ovisshetens dimma. Hon bär lugnet där kaos annars kunde gro och med sin helande förmåga skapar hon balans omkring sig.`,
      bodyEn:
        "Stellara Venvelia is the link between the stars and n0llan. Sent from the celestial sphere, she walks among n0llorna as the voice of Staben. Through her clear messages and gentle force, Stellara guides n0llan through the fog of uncertainty. She carries calm where chaos otherwise might grow, and with her healing ability creates balance around her.",
    },
  ];

  const peppers = [
    {
      name: "Theo",
      imageUrl: theo,
      body: `Hej hopp galopp! Mitt namn är Theo, 23 kalla vintrar gammal och iår är jag Øverpeppare tillsammans med Hannah🪩🥳 Jag är ursprungligen från Hufvudstan och ska nu börja mitt tredje år på data🧑‍💻

Mitt största tips är att unna er själva små belöningar i vardagen🤩🥰 Det kan va en god kopp kaffe i StudieC, en D-boll i Cafet eller riktigt god hämtmat🤠🥳 Livet är för kort för att inte njuta🥰

Vi ses i framtiden!♾️🪩 `,
      bodyEn: `Howdy hey! My name is Theo, 23 cold winters old, and this year I’m Øverpeppare together with Hannah🪩🥳 I’m originally from the Capital and I’m now starting my third year in Computer Science🧑‍💻

My biggest tip is to treat yourselves to little rewards in everyday life🤩🥰 It could be a nice cup of coffee in StudieC, a D-ball in the Café, or some really good takeaway🤠🥳 Life’s too short not to enjoy it🥰

See you in the future!♾️🪩`,
    },
    {
      name: "Hannah",
      imageUrl: hannah,
      body: `Hallå Äller! Hannah med H här! 🤪 Jag är Øverpeppare i år tillsammans med Theo och ska börja mitt andra år på infocom!! Jag fyller 22 år nu till höst och är en go och glad göteborgare som tyvärr har förlorat mycket av dialekten efter ett år i Lund 😔

Mitt bästa tips för att få en otroooooligt peppig nollning är att verkligen att ta till vara på denna tiden och NJUT! Våga släpp loss och testa nya saker!!! 

Kraaaam!! 🫂`,
      bodyEn: `PEPP-ALERT!!! 🤪 My name is Hannah and I’m one of your Øverpeppare together with Theo! 🫶🏼 I’m about to start my second year in Infocom, and I’ll be turning 22 this fall. I’m from Gothenburg, the west coast city of trams, salty seas, and the best fish you’ll ever taste #fishy 🩷🐟

My best advice for having a wonderful nollning is to stay open to anything and everything, try new things, and let yourself just have fun!! It’s such a special time, and you’ll miss it as soon as it’s over! 🥺

Many hugs!! 🫂`,
    },
    {
      name: "William",
      imageUrl: william,
      body: `Yoooooo!!! Mitt namn är William och ska börja mitt fjärde år på den otroliga linjen InfoCom! Jag är born and raised i Helsingborg och är 25 år ung 😎

Pro tip för att ditt framtida jag ska tacka dig är att inte glömma att ägna lite tid utanför nollningen till en hobby som ger dig energi ⚡️🔥

Nollningen kan vara väldigt intensiv och lite tid med din hobby kan vara nyckeln till att återhämta sig för nästa event!! ✨Så oavsett om din hobby är matlagning, träning eller gaming, glöm inte bort den! 🧑‍🍳🏋️🎮

Vi ses på nollningen, det kommer bli oändligt kul ♾️🔥`,
      bodyEn: `Yoooooo!!! My name is William and I’m about to kick off my 4th year at the iconic program InfoCom! I’m born and raised in Helsingborg and 25 years young 😎

A pro tip, that will make your future self thank you, is to spend some time outside of the introduction period with your hobbies that give you energy ⚡️🔥

The introduction period can be very intense and some time spent with your hobby could be the key to recharging for the next event!! ♾️✨ So regardless if your hobby is cooking, exercising or gaming, don’t forget about it! 🧑‍🍳🏋️🎮`,
    },
    {
      name: "Louise",
      imageUrl: louise,
      body: `Hallå i stugan! Louise heter jag och kommer från vår fina huvudstad. Har 22 år på ryggen och ska börja mitt fjärde och näst sista år på datateknik!👾

Mitt tips är aningen basic men bra: Sömn!😴 Nollningen är superkul men också rätt så lång (längsta nollningen i Sverige?🤔). Se till att försöka ta igen sömnen när du kan för att inte bli sjuk, orka plugga och möjligtvis också orka FESTA LOSS!!!🥳🥳`,
      bodyEn: `Hiya! My name’s Louise and I’m from Sweden’s lovely capital. I’m 22 years old and about to start my fourth and second-to-last-year in Computer Engineering !👾

My tip might sound a bit basic, but trust me, it’s golden: Sleep!😴 The initiation weeks are insanely fun, but also pretty long (the longest in Sweden, maybe?🤔). Make sure to catch up on sleep whenever you can so you don’t get sick, can keep up with your studies, and most importantly, have the energy to PARTY HARD!!!🥳🥳 
`,
    },
    {
      name: "Carl",
      imageUrl: carl,
      body: `Kachow! Mitt namn är Carl och är nu 21 år gammal. Jag är från gørgoa östgöta-SCHLättah (Linkan) och ska nu påbörja mitt andra år på infocom 🤙 🤙 

För att maxa din framtida nollningsupplevelse så rekommenderar jag starkt att du tar och pumpar cykeldäcken, så att du kan blåsa till och från alla event som en riktig fartdåre!!🚴‍♀️ 💨 

Vi ses i krokarna ♾️ 🥳 
`,
      bodyEn: `Kachow! My name’s Carl and I am 21 years old. I’m from the glorious east-side plains of Östergötland (Linköping) and I’m about to kick off my second year in Infocom 🤙 🤙

To make sure you achieve the best future nollnings-experience, I seriously recommend pumping up those bike tires so you can zoom to and from every event like a true speed demon!! 🚴‍♀️ 💨

Catch you around ♾️ 🥳`,
    },
    {
      name: "Wilma",
      imageUrl: wilma,
      body: `Hej icons! Jag heter Wilma och ska börja mitt fjärde år på ✨infocom✨! Jag kommer från den idylliska staden Kungsbacka, och är nu stabila 24 år💅🤩

Mitt största tips för er 🔮framtid🔮 här på sektionen är att hålla ett öppet sinne! 🤯 Man vet aldrig vilket event eller aktivitet som passar en bäst, därför ska man testa så mycket som möjligt! Vem vet vem man lär känna eller vilket utskott man tar intresse för på sektionen?✨🩷`,
      bodyEn: `Hi icons! My name is Wilma and I’m starting my fourth year of ✨infocom✨! I’m from the amazing city of Kungsbacka, and this year I’m 24 years old!

My best tip for your 🔮future🔮 here at the D-guild is to keep an open mind! 🤯 You never know what event or activity might be your favorite, so try as many things as you can! Who knows who you might get to know or what committee you will find interesting? ✨🩷`,
    },
    {
      name: "Abbe",
      imageUrl: abbe,
      body: `Wazzaaa!! 🤪

Jag heter Albert aka Abbe och kommer från metropolen Mölnlycke utanför Göteborg. Jag är 21 år och ska precis börja mitt tredje år på Data!

Mitt bästa tips är att passa på att lära känna sektionens utskott under nollningen. Det finns massor av kul att göra, oavsett om du gillar fest, programmering, sport eller bara gött häng. Testa nåt nytt, du kommer inte ångra dig!

Vi ses i dimman! 🕺🏼 
`,
      bodyEn: `Wazzaaa!! 🤪

My name is Albert aka Abbe, and I'm from Mölnlycke just outside Gothenburg. I'm 21 years old and about to start my third year in Computer Science!

My best tip is to take the opportunity to get to know the guild’s committees during the nollning. There's tons of fun stuff to do, whether you're into partying, programming, sports, or just looking for good company. Try something new, you won't regret it!

See you on the dance floor! 🕺🏼`,
    },
    {
      name: "Simon",
      imageUrl: simon,
      body: `Hej hej! Simon heter jag och är en 23-årig stockholmare som ska börja tredje året på bästa infocom.  💜🕺

Mitt bästa tips inför nollningen är att försöka gå på så många pluggkvällar och lunchföreläsningar som möjligt. Pluggkvällarna är ett jättebra sätt att lära känna nya kompisar och att ta hjälp av äldre studenter för att komma igång med plugget, och man tackar ju inte nej till gratis mat! 😋`,
      bodyEn: `Helloooo! I’m Simon! A 23 year old from Stockholm who is about to begin their third year at infocom. 💜🕺

My best advice for the introduction is to attend as many study nights as possible. They are a fantastic opportunity to make new friends and to get help with the studies from older students, and you never say no to free food 😋`,
    },
    {
      name: "Astrid",
      imageUrl: astrid,
      body: `Heeej!! Astrid heter jag, är 22 år och kommer från den nästbästa studentstaden Uppsala!!! Jag ska till hösten påbörja mitt tredje år på InfoCom🙈😍 

För att få en oääändligt rolig studietid är mitt stora tips till n0llningen att mingla, mingla, mingla!!! Ta varje chans att prata med nya människor och häng med på stort och smått!! Den där ica-turen kanske är så du hittar din framtida bästa kompis och plugghjälp♾️🥰❤`,
      bodyEn: `Heeey!! My name is Astrid, I’m 22 years old and I’m from the second best student city, Uppsala!!! This fall I’m starting my third year in Infocom 🙈😍

To have an infinitely fun student life, my biggest tip for the introduction is to mingle, mingle, mingle!!! Take every chance to talk to new people and join in on both big and small things!! That little trip to ICA might just be how you find your future best friend and study buddy ♾️🥰❤`,
    },
    {
      name: "David",
      imageUrl: david,
      body: `Tjenare tjenare

David heter jag (eller på spanska ”dönda est alla biblioteket”🌎). Jag är 21 år och kommer från Bästkustens sommar paradis Varberg🏖️🌊. När jag inte peppar och bär kjol 🌶️👗så går jag 3de året på data! 

Pro tip från 3026 ✨♾️ är att laga många matlådor, men sparar tid, pengar och blir oftast godare, en favorit låda från framtiden är teriyaki gräshoppor med vildris! Mums 🤤🤤

Harre gött!`,
      bodyEn: `Hey hey!
My name’s David (or in Spanish, “dönda est alla biblioteket” 🌎). I’m 21 years old and come from the West Coast’s summer paradise, Varberg 🏖️🌊. When I’m not hyping things up and rocking a skirt 🌶️👗, I’m in my 3rd year of computer science!
Pro tip from the year 3026 ✨♾️: cook lots of meal preps — it saves time, money, and usually tastes better. A favorite box from the future is teriyaki grasshoppers with wild rice! Yum 🤤🤤
Take care!`,
    },
    {
      name: "Edwin",
      imageUrl: edwin,
      body: `Hej hopp! 
Mitt namn är Edwin, är 19 år och kommer från kossornas epicentrum, Falköping🐮 Nu till hösten börjar jag mitt andra år på InfoCom!💜

Mitt bästa tips för att hitta rätt i framtiden är att ställa frågor till äldre studenter! Såsom hur man hittar på campus och vart dem bästa pluggplatserna finns📘🧭 Ingen fråga är för dum för att ställa och vi svarar mer än gärna!`,
      bodyEn: `Heeey!
My name is Edwin, I’m 19 years old and from the little town of Falköping 🐮 This autumn I’ll be starting my second year in Infocom!

My best tip for finding your way in the future is to ask questions to the older students! For example, how to get around campus or where the best study spots are 📘🧭. No question is too dumb to ask, and we’ll gladly answer!`,
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
          class="absolute inset-x-4 bottom-10 max-w-full transform text-center font-nolla-stab text-6xl leading-snug text-base-100 text-stroke-secondary text-stroke-6 md:hidden md:text-8xl"
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
          href={`https://minio.api.dsek.se/files/public/miscellaneous/rights-sv-2025.pdf`}
          class="{data.revealTheme
            ? 'btn-secondary-beige'
            : 'btn-primary-dark'}  btn self-start"
          >{m.nollning_landing_policy_read()}</a
        >
        <a
          href={"http://bit.ly/trivselkontakt"}
          class="{data.revealTheme
            ? 'btn-secondary-beige'
            : 'btn-primary-dark'} btn self-start">{m.home_contactWellbeing()}</a
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
        class="absolute -inset-x-[50dvw] -inset-y-10 -z-0 opacity-30 max-md:bg-[length:32rem] max-md:bg-scroll md:bg-[length:48rem] md:bg-fixed"
        style={`background-image: url('${infinity}')`}
      ></div>
      <h1
        class="z-10 mb-4 p-2 text-center font-nolla-pepp text-5xl tracking-widest text-[#F280A1] text-stroke-gray text-stroke-4 max-md:text-stroke-2 md:text-8xl"
      >
        Peppfinity
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
