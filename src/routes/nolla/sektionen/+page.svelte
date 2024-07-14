<script lang="ts">
  import DChipLogo from "./d-chip.webp";
</script>

<header>
  <h1 class="mx-auto text-center font-nolla-mono text-8xl font-bold">
    D-sektionen
  </h1>
  <h2
    class="mx-auto text-center text-[2.3rem] font-bold text-primary drop-shadow-sm"
  >
    Där studierna och studentlivet möts
  </h2>
</header>

<article class="flex flex-col items-stretch gap-16 py-16">
  <div class="flex items-stretch">
    <section class="neo-brutal-box bg-secondary">
      <h3 class="font-nolla-mono text-2xl font-semibold">Sektionen</h3>
      <p class="flex-1">
        På LTH finns det elva sektioner och vilken sektion du är med i beror på
        vad du pluggar. Vi som pluggar datateknik eller informations- och
        kommunikationsteknik tillhör D-sektionen. Sektionen håller på med allt
        från studiebevakning till att hålla i nollningen. Sektionen anordnar
        även fester, pluggkvällar, LAN-partyn, brädspelskvällar, badminton,
        löpning, volleyboll, resor till andra universitet, en
        arbetsmarknadsmässa, meckar med servrar, driver ett café, har ett
        fotbollslag, en tidning, utvecklar vår egen hemsida och en app.
        Sektionen har något för de flesta och är det något sektionen inte gör
        som du tycker behövs göras finns det ofta utrymme för att driva igenom
        dina idéer!
      </p>
      <a class="neo-brutal-btn w-min rounded-box" href="/home"> dsek.se </a>
    </section>
    <img src="#" alt="D-sektionen" class="flex-1" />
  </div>

  <section
    class="neo-brutal-box grid flex-1 grid-cols-5 grid-rows-2 place-items-stretch !p-0"
  >
    <div class="col-span-3 bg-primary">
      <div class="h-full w-full rounded-br-box bg-base-100 p-4">
        <img src="#" alt="D-sektionens styrelse" />
      </div>
    </div>
    <div class="col-span-2 rounded-t-box bg-primary px-10 pb-8 pt-16">
      <h3 class="font-nolla-mono text-2xl font-semibold">Styrelsen</h3>
      <p>
        Sektionen leds av ett härligt gäng ledamöter som alla ansvarar för
        varsitt område. Utöver detta består sektionen av 14 utskott, varav de
        flesta bedrivs av en ansvarig styrelsemedlem. <a
          href="/committees"
          class="link">Läs mer her</a
        >
      </p>
    </div>
    <ul
      class="col-span-5 grid grid-cols-3 gap-2 rounded-box rounded-tr-none bg-primary px-10 pb-16 pt-8 [&>li>b]:block"
    >
      <li>
        <b>Ordförande</b> leder styrelsen och representerar sektionen utåt.
      </li>
      <li>
        <b>Vice ordförande</b> är sekreterare, skriver mötesprotokoll och håller
        styrdokument uppdaterade.
      </li>
      <li>
        <b>Skattmästaren</b> är sektionens kassör och expert på bokföring.
      </li>
      <li>
        <b>Studierådsordförande</b> leder och organiserar studiebevakningsarbetet
        på sektionen, samt anordnar pluggkvällar.
      </li>
      <li>
        <b>Informationsansvarig</b> ansvarar för informationsspridningen på sektionen.
      </li>
      <li>
        <b>Cafémästaren</b> driver sektionens café och håller i bruncher.
      </li>
      <li><b>Sexmästaren</b> anordnar sittningar, pubar och eftersläpp.</li>
      <li>
        <b>Källarmästaren</b> ansvarar för sektionens lokaler, hårdvara och bil.
      </li>
      <li>
        <b>Näringslivsansvarig</b> ansvarar för sektionens kontakt med näringslivet.
      </li>
      <li><b>Aktivitetsansvarig</b> håller i allt mellan sport och spel.</li>
    </ul>
  </section>

  <div class="flex items-stretch">
    <section class="neo-brutal-box bg-secondary">
      <img
        src={DChipLogo}
        alt="D-chips styrelse"
        class="h-auto max-h-16 w-auto max-w-full"
      />
      <p>
        D-Chip är en ideell, studentdriven förening vid D-sektionen som
        studenterna på Datateknik och InfoCom på LTH hör till. Alla kvinnliga
        och icke-binära studenter på de två programmen kan vara med i D-Chip. Vi
        finns för att främja er trivsel på sektionen samt att verka för mer
        kvinnligt och icke-binärt engagemang.
      </p>

      <a
        class="neo-brutal-btn w-min whitespace-nowrap rounded-box"
        href="https://dchip.dsek.se"
      >
        D-chips hemsida
      </a>
    </section>
    <figure class="flex-1">
      <img
        src="#"
        alt="D-chips styrelse"
        class="h-auto max-h-full w-auto max-w-full"
      />
    </figure>
  </div>
</article>
