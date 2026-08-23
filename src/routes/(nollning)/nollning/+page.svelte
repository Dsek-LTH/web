<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";
  import logo from "./(photos)/logga.png";

  import veloria from "./(photos)/staben/veloria.png";
  import knyx from "./(photos)/staben/knyx.png";
  import ymir from "./(photos)/staben/ymir.png";
  import nevira from "./(photos)/staben/nevira.png";
  import orion from "./(photos)/staben/orion.png";
  import kryon from "./(photos)/staben/kryon.png";
  import groupProfile from "./(photos)/staben/header-mobile.png";
  import groupLandscape from "./(photos)/staben/header.png";
  import heavenBG from "./(photos)/bakgrund.jpg";
  import SnowEffect from "$lib/components/postReveal/SnowEffect.svelte";

  import oscar from "./(photos)/pepp/oscar.jpg";
  import vincent from "./(photos)/pepp/vincent.jpg";
  import clara from "./(photos)/pepp/clara.jpg";
  import frida from "./(photos)/pepp/frida.jpg";
  import isac from "./(photos)/pepp/isac.jpg";
  import ella from "./(photos)/pepp/ella.jpg";
  import alexander from "./(photos)/pepp/alex.jpg";
  import love from "./(photos)/pepp/love.jpg";
  import alva from "./(photos)/pepp/alva.jpg";
  import anna from "./(photos)/pepp/anna.jpeg";
  import hilda from "./(photos)/pepp/hilda.jpg";
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
      bodyEn:
        "Ve||ORia PolarIX is the guardian of the primal frost and the unyielding core of Staben. When the cold swept over Lund and froze the flow of time, she remained in the midst of the ice crystals like a guiding star in the polar night. She wears the cold as a shield, and through her cold, clear gaze, Staben is kept united in the deepest darkness. As long as Ve||oria guides from her throne of frost, the Nolla remains safe and protected against the invisible winds of the permafrost.",
    },
    {
      name: "Nevira Aete||na",
      imageUrl: nevira,
      body: "Ur mörka glaciärsprickor och uråldrig tjäla formar Nevira Aete||na tingens ordning. Hon väver samman materia som härdats under tusenårigt tryck och förvandlar det råa elementet till föremål med dold mening. I Neviras händer blir varje ting en länk som binder Staben till permafrostens eviga substans. Hon är den tysta kraften som ser till att allt har sin plats och att grunden aldrig ger vika.",
      bodyEn:
        "From dark glacier crevasses and ancient frost, Nevira Aete||na shapes the order of things. She weaves together matter hardened under millennial pressure, transforming the raw elements into objects of hidden meaning. In Nevira's hands, every object becomes a link that binds Staben to the eternal substance of the permafrost. She is the silent force ensuring that everything has its place and that the foundation never gives way.",
    },
    {
      name: "OriOn Silentíum",
      imageUrl: orion,
      body: "I permafrostens tystnad och under det flammande norrskenet vandrar OriOn Silentium. Med en blick som skär igenom täta snöbyar böjer han köldens magi för att samla överflöd och resurser från svåråtkomliga vidder. Orion är arkitekten bakom de stunder då kylan viker undan och förvandlas till strålande sammankomster, där nollans gemenskap förseglas i frostens klara sken.",
      bodyEn:
        "In the silence of the permafrost and beneath the flaming northern lights wanders OriOn Silentium. With a gaze that cuts through dense snow squalls, he bends the magic of the cold to gather abundance and resources from inaccessible expanses. Orion is the architect behind those moments when the cold recedes and transforms into radiant gatherings, where the Nolla's fellowship is sealed in the clear glow of the frost.",
    },
    {
      name: "Kryon TiberiOS",
      imageUrl: kryon,
      body: "KryON TiberiOS är runden av norrskenets budbärare, länken mellan permafrostens kärna och världen utanför. Ur ovisshetens dimma tränger hans röst igenom som en klar fläkt av frostluft och ger vägledning åt alla sökande själar, oavsett varifrån de färdats. Med sitt obrytbara lugn raderar KryON ut all oro och väver samman nollorna till en helhet. ",
      bodyEn:
        "KryON TiberiOS was created as the messenger of the aurora, the link between the core of the permafrost and the world beyond. From the mist of uncertainty atop the walls of ice, his voice pierces through like a crisp gust of frost-air, offering guidance to all searching souls. Like a watcher in the polar night, he scans the frozen wastes to keep threats at bay, weaving the nollor into a unified whole.",
    },
    {
      name: "Ymir AmorIoT",
      imageUrl: ymir,
      body: "Sprungen ur permafrostens renaste formspråk ristar Ymir AmorIoT tidens mönster och utmaningar. Ur glaciärernas dolda djup mejslar han fram visuella symboler och prövningar skapade för att härda och förena nollorna. Genom Ymirs känsla för form blir varje skapelse ett avskalat konstverk av frusen skönhet, skapat för att bäras genom alla skeden.",
      bodyEn:
        "Born from the purest expressions of the permafrost, Ymir AmorIoT carves the patterns and challenges of time. From the hidden depths of the glaciers, he chisels forth visual symbols and trials created to forge and unite the Nollas. Through Ymir's sense of form, every creation becomes a minimalist masterpiece of frozen beauty, made to be carried through every phase.",
    },
    {
      name: "Knyx Gelator",
      imageUrl: knyx,
      body: "Väckt ur permafrostens djupaste skikt står Knyx Gelator som en oböjlig mur och vakar över rets gränser. För honom är kölden ett värn som skyddar och bevarar. Med ett vakande öga över alla vägar ser Knyx till att isen bär och att inga sprickor uppstår i Stabens struktur. Han bär nyckeln till tryggheten och ser till att nollan rör sig säkert över den frusna marken.",
      bodyEn:
        "Awakened from the deepest layers of the permafrost, Knyx Gelator stands as an unbending wall, watching over the boundaries. To him, the cold is a bulwark that protects and preserves. With a watchful eye over all paths, Knyx ensures that the ice holds and that no cracks appear in the structure of Staben. He holds the key to safety and ensures that the Nolla moves securely across the frozen ground.",
    },
  ];

  const peppers = [
    {
      name: "Vincent",
      imageUrl: vincent,
      body: `Hallöö 😛

Vincent (med T på slutet) här 🤩😮‍💨Jag är från storstaden Eslöv (din huvudstad 👑) och har precis blivit introllad på mitt fjärde år här på data 🩷🪄 

Efter mina 22 år på cirkusen har jag lärt mig att det ibland kan bli svårt när man har väldigt många bollar i luften 🤹‍🥎Därför kan det vara väldigt skönt att istället lägga bollarna på marken, och lira lite fotboll med sektionens alldeles egna fotbollslag, DICK ⚽️🤏

Peace out 🫶
`,
      bodyEn: `Hellöö 😛
Vincent (with a T at the end) here 🤩😮‍💨 I’m from the big city of Eslöv, and I’ve just been magically initiated into my fourth year here at Computer Science 🩷🪄
After my 22 years in the circus, I’ve learned that things can get a little tricky when you have too many balls in the air 🤹‍🥎 That’s why it can be nice to put the balls on the ground instead and play some football with the guild’s very own football team, DICK ⚽️🤏
Peace out 🫶
`,
    },
    {
      name: "Alva",
      imageUrl: alva,
      body: `Hejsan Hoppsan!!
Alva heter jag och ska börja mitt tredje år på Datateknik!🩷🩷 Jag är 21 år ung och kommer ursprungligen från Astrid Lindgrens egna hemtrakter, nämligen lilla lilla Vimmerby!!🤏

Ibland kan livet på cirkusen kännas både lite svårt och läskigt till en början. Ny stad, nytt boende, nya studier och nya människor är väldigt många olika bollar att jonglera samtidigt!🤹🤹Du får därför inte glömma bort att vara lite extra snäll mot både dig själv och alla andra så här i början🫶 Låt saker få ta lite tid men glöm inte heller bort att enda sättet att ta reda på hur långt du kan gå, är genom att våga dig ut på linan!🤸‍♀️ 

Vi ses på cirkusen!🎪🩷💜
`,
      bodyEn: `Hello Hello!!!
My name is Alva and I’m about to start my third year of Computer Engineering! 🩷🩷 I’m 21 years young and originally from Astrid Lindgren’s very own home region, the tiny little town of Vimmerby!!
Sometimes life at the circus can feel both difficult and a little scary, especially in the beginning. A new city, a new home, new studies and new people are a lot of balls to juggle all at once 🤹🤹 So don’t forget to be a little extra kind to both yourself and everyone around you during this time 🫶 Give things some time, but don’t forget that the only way to find out how far you can go is to dare to step out onto the tightrope! 🤸‍♀️
See you at the circus! 🎪🩷💜
`,
    },
    {
      name: "Oscar",
      imageUrl: oscar,
      body: `Halloj!

Oscar heter jag och jag är 21 bast. Jag härstammar från en liten ort som heter Stockholm och startar andra året på D.

Under nollningen väntas många långa äventyr och shower. Där bland dem kan man ofta finna sig på en cykel eller voi. Men från en erfaren cirkus uppträdare till en annan rekommenderar jag att vid brist på egen cykel att ta en lundahoj. Absolut hidden gem 🔍💎

 Ses på scenen!  🎪
`,
      bodyEn: `Hey everyone!
My name is Oscar, I’m 21 years old, and I come from a small town called Stockholm. I’m starting my second year at D.
During the introduction weeks, there are plenty of long adventures and shows to look forward to. Along the way, you’ll often find yourself on a bike or a Voi. But from one experienced circus performer to another, in absence of your own bike, use a lundahoj. Absolute hidden gem 🔍💎
`,
    },
    {
      name: "Ella",
      imageUrl: ella,
      body: `Hallå eller! Jag heter Ella, är 23 år och kommer från gbg! Jag pluggar infocom och börjar nu mitt andra år på LTH! 💜
Studentlivet är lite av en cirkuskonst, och det gäller att lära sig hur man ska kasta runt sina pengar🤹💸Mitt tips är att leta efter begagnad kurslitteratur innan ni köper sprillans nytt! Fråga era phaddrar, andra pluggkompisar eller oss i Peppet! Man kan spara massor av pengar som man kan lägga på annat kul! 🎟️🍿
Släpp loss på cirkusen!🎪
`,
      bodyEn: `Hey there! My name is Ella, I’m 23 years old and I’m from Gothenburg! I study Infocom and I’m now starting my second year at LTH! 💜
Student life is a bit of a circus act, and one thing you’ll have to learn is how to juggle your money! 🤹💸 My tip is to always look for second-hand course literature before buying it brand new! Ask your mentors, fellow students, or us in Peppet! You can save loads of money that you can spend on other fun things instead! 🎟️🍿
Come join the circus! 🎪
`,
    },
    {
      name: "Alexander",
      imageUrl: alexander,
      body: `Tjena tjena! 👋

Jag heter Alexander, kallas även "Hyllan", kommer från Stockholm och är 22 år gammal. Nu till hösten börjar jag mitt tredje år på Data 👨‍🎓👨‍💻

Cirkusen är stor och här finns en plats för alla! Oavsett om du vill röja på dansgolvet, spela brädspel, idrotta eller koda i lugn och ro. Det finns garanterat en cirkusakt just för dig. Hitta något du tycker är kul och gör showen till din egen! 🎪✨

Hoppas vi ses! 🎠🍿
`,
      bodyEn: `Hey there! 👋
My name is Alexander, also known as "Hyllan", I’m from Stockholm and I’m 22 years old. This fall, I’m starting my third year of Computer Science 👨‍🎓👨‍💻
The circus is big and there’s a spot for everyone here! Whether you want to tear up the dance floor, play board games, do sports, or code in peace. There is guaranteed to be a circus act just for you. Find something you enjoy and make the show your own! 🎪✨
Hope to see you! 🎠🍿
`,
    },
    {
      name: "Hilda",
      imageUrl: hilda,
      body: `Hallådääär! Det är jag som är Hilda och jag kommer från den kära staden Göteborg🙌 Jag är 20 år gammal och går mitt 2:a år på Infocom!

En dag på cirkusen råkade jag tappa min mobil i en magikers trollhatt, och när jag skulle leta efter den var den helt plötsligt borta! 😔Tack och lov hade jag vänner som jag delat min telefons plats med på Hitta så med hjälp av dem gick det fort att få tillbaka den! För en person som lätt tappar bort sin mobil har det varit enormt hjälpsamt att dela plats med någon man litar på🙏🔥
`,
      bodyEn: `Hellooo!! Hilda is my name, and I’m from the lovely city of Gothenburg 🙌 I’m 20 years old and currently in my second year studying Infocom!
One day at the circus, I accidentally dropped my phone into a magician’s hat, and when I went to look for it, it had completely disappeared! 😔 Luckily, I had friends that I shared my location with through Hitta, and with their help, it didn’t take long to get my phone back! For someone who tends to lose their phone quite easily, sharing my location with someone I trust has been incredibly helpful 🙏🔥
`,
    },
    {
      name: "Isac",
      imageUrl: isac,
      body: `Hejsan svejsan!
Isac heter jag och är 23 vintrar ung. Jag har kommit med cirkuståget hela vägen från självaste huvfudstaden STHLM och ska nu börja mitt andra år på Data! 💻✨
Våga bjuda på sig själv! Det kan kännas läskigt att kliva ut i rampljuset, men kom ihåg att alla på cirkusen är lika nervösa 🎪🫣 Efter showen kommer ingen minnas att man misslyckade sitt magitrick, men alla kommer att minnas hur kul man hade tillsammans! 🚀🎉
Tagga bästa showen någonsin! 🎪🍿
`,
      bodyEn: `Hi and hello!
My name is Isac and I am 23 winters young! I’ve come all the way from Stockholm together with the circus and I’m about to start my second year studying Computer Science! 💻✨
Dare to put yourself out there! Stepping into the spotlight can definitely feel scary, but just remember that everyone at the circus are all equally nervous 🎪🫣 Once the show is over, nobody is going to care if you failed your magic trick, but everyone will remember how much crazy fun you had together! 🚀🎉
Get ready for the best show ever! 🎪🍿
`,
    },
    {
      name: "Clara",
      imageUrl: clara,
      body: `Halloj!

Mitt namn är Clara, jag är 25 år gammal och kommer från Lunds bästa grannstad, Malmö! Jag pluggar data och kommer nu att börja mitt fjärde år! 😛

På cirkusen har jag lärt mig att det mesta blir bättre om man gör det tillsammans! Så jag tipsar verkligen om att våga ta hjälp av dem runt omkring er nu i början även om det kan kännas läskigt!🫶🏼

Ha det gött! 😗
`,
      bodyEn: `Hi there!

My name is Clara, I am 25 years old and I’m from Lunds best neighbouring city, Malmö! I study Computer Science and I am about to start my fourth year! 😛

During my time at the circus, I’ve learned that most things turn out better when you do them together. So, my biggest tip is to dare to ask the people around you for help right from the start, even if it might feel a bit scary!🫶🏼

Take care! 😗
`,
    },
    {
      name: "Anna",
      imageUrl: anna,
      body: `Tjabba tjena hallå!
Jag heter Anna, har 23 år på nacken och är ursprungligen från Stockholm! Jag är nu inne på mitt fjärde år på data. 😋💘
På cirkusen kan vad som helst hända så det gäller att vara redo! 🎪Jag tycker att du ska köpa en balklänning eller frack som du känner dig fin i! Så skönt att ha till hands, du kommer få mycket användning av det under ditt studentliv! 🕺🏼🫶🏻
PoK 💞🎠
`,
      bodyEn: `Hiiiiiiiii!
My name is Anna, I’m 23 years old and I’m originally from Stockholm! I’m now starting my fourth year in Computer Science. 😋💘
Anything can happen at the circus, so you better be prepared! 🎪 I recommend you buying a prom dress or a suit that you feel nice in! It’s good to have on hand, and you will get a lot of use of it! 🕺🏼🫶🏻
Xoxo 💞🎠
`,
    },
    {
      name: "Frida",
      imageUrl: frida,
      body: `Hej alla fina!!! 

Jag heter Frida och ska börja mitt tredje år på InfoCom💜🕺 Jag kommer från underbara Stockholm och är 22 år gammal 🙌

Mitt bästa tips för en oförglömlig nollning är att föreviga 🤳 alla minnen ni skapar på cirkusen!!! Ta måååånga bilder och dela dem med alla i phaddergruppen så kan ni se tillbaka på dem när cirkusen rullar vidare 🎠🎪❤️

Vi ses! 😇
`,
      bodyEn: `Hi everyone!!!
My name is Frida and I’m about to start my third year of InfoCom 💜🕺 I’m from the wonderful city of Stockholm and I’m 22 years old 🙌
My best tip for an unforgettable nollning is to capture 🤳 all the amazing memories you make at the circus!!! Take looooots of pictures and share them with everyone in your phadder group, so you can look back on all the fun memories once the circus has moved on 🎠🎪❤️
See you around! 😇
`,
    },
    {
      name: "Love",
      imageUrl: love,
      body: `Hej hej!
Jag heter Love och är en 22 år gammal Östgöte! Jag kommer (nääästan) från Linköping, och ska nu börja mitt tredje år på data! 💖🤹
Cirkuslivet har lärt mig att saker sällan blir exakt som man tänkt sig, men att det faktiskt brukar lösa sig ändå. Som student så kan det vara lätt att snöa in sig på plugget, men missa inte allt roligt! 🤩
Som en vis man en gång sa:
 "Det finns omtentor, men inga omfester"
Vi ses! ✌️
`,
      bodyEn: `Wassup!
My name is Love, and I’m a 22-year-old Östergötland native! I’m (almoooost) from Linköping, and I’m now starting my third year of Computer Science! 💖🤹
Circus life has taught me that things rarely turn out exactly as planned, but that somehow, things usually work out anyway. As a student, it can be easy to get completely caught up in your studies, but don’t miss out on all the fun! 🤩
As a wise man once said:
 "There are re-exams, but no re-parties."
See you! ✌️
`,
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
          style="background-image: url('{groupProfile}'); box-shadow: inset 0 -100px 100px -100px #3e619e;"
        ></div>
        <div
          class="hidden h-full w-full bg-cover bg-center bg-no-repeat max-md:bg-scroll md:block md:bg-fixed"
          style="background-image: url('{groupLandscape}'); box-shadow: inset 0 -100px 75px -100px #3e619e;"
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
          <button onclick={() => (snowActive = !snowActive)}>
            <img
              src={logo}
              class="absolute left-1/2 top-1/2 size-60 -translate-x-1/2 -translate-y-1/2 md:size-[480px]"
              alt="Nollning logo non-spinning"
            />
          </button>
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
        class="stroke-text relative z-10 mb-4 p-2 text-center font-nolla-pepp text-5xl leading-loose tracking-widest text-[#ffb800] md:text-8xl"
      >
        Show De<br />La Pepp
      </h1>
      <div class="-mt-20 w-full scroll-m-20 pt-20">
        <div
          class="max-md:carousel max-md:!flex md:grid md:grid-cols-6 md:gap-[8rem]"
        >
          {#each peppers as pepper, index (pepper.name)}
            <div
              class="max-md:contents md:col-span-2 {index === 0
                ? 'md:col-start-2'
                : ''} {index === 1 ? 'md:col-start-4' : ''}"
            >
              <PersonCarouselItem
                name={pepper.name}
                {index}
                imageUrl={pepper.imageUrl}
                body={languageTag() === "en" ? pepper.bodyEn : pepper.body}
                textColor="text-[#FFFFFF]"
                maxWidth="max-w-8x1"
                backgroundBox={true}
              />
            </div>
          {/each}
        </div>
      </div>
    </section>
    {#if data.revealTheme}
      <!--<iframe
        class="aspect-video w-full"
        src="https://www.youtube.com/embed/rRPQs_kM_nw"
        title="Nolledans film"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>-->

      <div class="mx-auto max-w-3xl">
        <div
          class="aspect-[8/5] w-full overflow-hidden rounded-lg border-4 border-secondary"
        >
          <iframe
            src="/STABEN26_Web/index.html"
            title="STABEN26 spel"
            class="h-full w-full"
            allow="fullscreen"
            allowfullscreen
          ></iframe>
        </div>
      </div>
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

<style>
  .stroke-text {
    -webkit-text-stroke: 2px #ff3347;
    line-height: 1.2;
  }

  @media (min-width: 768px) {
    .stroke-text {
      -webkit-text-stroke: 5px #ff3347;
    }
  }
</style>
