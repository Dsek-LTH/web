<script lang="ts">
  // As to avoid cluttering up the translation file, all words in the word list are part of a single translation value
  // The format is like this: Definition - description\nDefinition - description
  import { availableLanguageTags, languageTag } from "$paraglide/runtime";
  type Lang = (typeof availableLanguageTags)[number];

  // TODO: Translate
  const wordBank: Array<{ sv: string } & Partial<Record<Lang, string>>> = [
    { sv: "AFB - Förser studenterna med studentbostäder." },
    { sv: "AF-borgen - Plats för bal och spex." },
    { sv: "Cheps - Definition saknas..." },
    { sv: "CSN - 🤑🤑🤑." },
    { sv: "Delphi - Lunds studentghetto." },
    {
      sv: "Delphivrål - Ångestfyllt, hjärtskärande, utdraget vrål som kan höras runt Delphi med omnejd kl. 23.00 under tentaveckorna.",
    },
    { sv: "D - Fjärde bokstaven i alfabetet. " },
    {
      sv: "Datagården - fjärde gården på Kämnärsrätten, många D:are bor/bodde där.",
    },
    { sv: "D:are  - Person på D-sektionen." },
    { sv: "D-café - Vårt café i iDét." },
    {
      sv: "D-huset - Byggnaden där D:are spenderar mestadelen av sin tid på campus.",
    },
    { sv: "D-sektionen - Den bästa sektionen." },
    { sv: "Eftersläpp - Klubb som öppnas efter sittning." },
    { sv: "E-huset - En felstavning av D-huset." },
    { sv: "Gasque - Finare sittning." },
    {
      sv: "Gyckel - Kort scenframträdande. Görs alltid två stycken innan man får lämna scen.",
    },
    {
      sv: "Högtidsdräkt - Se <a href='/nolla/packing#kladkod'>klädkoder</a>.",
    },
    { sv: "iDét - Vårt hem i D-huset." },
    { sv: "Inspektor - Äldre och klokare person som rådgiver sektionen." },
    { sv: "Kämnärsrätten - Nordligt lägenhetsområde nära Willys." },
    {
      sv: "LED - Ett café i D-huset som tror de är något. Läsare rekommenderas att gå till D-café istället.",
    },
    { sv: "Lila - Vår andra sektionsfärg, #9966CC ;)" },
    { sv: "N0llan - Teknolog i träningsphasen. " },
    {
      sv: "Nation - Fritidsförening som anordnar klubbar och annat skojsigt. ",
    },
    { sv: "Nollegasque - Den stora avslutande sittningen på nollningen. " },
    { sv: "Nollegeneral - Nollningens general." },
    { sv: "Ouvve - Ouverall. Teknologens favoritplagg." },
    { sv: "Peppare - Håller i nollningen." },
    { sv: 'Ph - Förkortning av "f".' },
    { sv: "Phadder - Din männskliga guide till studentlivet." },
    { sv: "Rekursion - se Rekursion." },
    { sv: "Rosa - NEJ! Se Råsa." },
    { sv: "Råsa - Vår sektionsfärg, #F280A1 ;)" },
    {
      sv: "Råsenbad - Rum i iDét där styrelsen styr, ledarna leder och möten möts.",
    },
    {
      sv: "Shäraton - Ett litet mysrum i iDét med brädspel, TV-spel och soffor.",
    },
    {
      sv: "Sjungbok - Så du kan hänga med i svängarna, också anteckningsblock på sittningar.",
    },
    {
      sv: "Sjön Sjøn - Sjön runt ön Øn. En uppfriskande simtur uppskattas, glöm bara inte skorna och att hålla munnen jättestängd.",
    },
    { sv: "Slasque - Fulare sittning med Ouvve." },
    {
      sv: "Sparta  - Studentghetto i Lund där folk lever enkelt utan onödig lyx.",
    },
    { sv: "Spex - En studentikos musikal framförd av andra LU studenter." },
    { sv: "Spex - En studentförening som anordnar spex." },
    { sv: "Spex - Vad vissa andra sektioner kallar gyckel. Se Gyckel." },
    {
      sv: "Studentikost - (OBS! Inte kost som i mat, utan uttalas kåååst) Något som bara en student skulle göra. ",
    },
    { sv: "Sångbok - Felstavning, se Sjungbok." },
    {
      sv: "Teknologmössa - Teknologens jättefina huvudbonad med en jättevacker spegatklädd tofs. Får enbart bäras av ettor och äldre.",
    },
    {
      sv: "Kiosken Kiosken - Den numera ickefungerande kommunikationshytten på ön Øn.",
    },
    { sv: "Tenta - Se Ångest." },
    {
      sv: "TLTH - Kåren på LTH, den förening som sammanbinder alla sektioner. ",
    },
    { sv: "Ångest - Se Tenta. " },
    { sv: 'Ø - Förkortning av "Ö".' },
    {
      sv: "ön Øn - Ön i mitten av sjön Sjøn. Oftast obebodd, utom under Regattan, då den är så överbefolkad att den nästan sjunker. ",
    },
    { sv: "Øverpeppare - Pepparnas mamma och pappa." },
  ];
  const wordList = wordBank
    .map((item) => {
      const word = item[languageTag()];
      if (!word) return null;
      const [definition, ...rest] = word.split(" - ");
      const description = rest.join(" - "); // in case it contains multiple " - "

      return {
        definition,
        description: description
          ?.replace("<a href", '<a class="link" href')
          ?.replace(
            /([sS]e{1,2}) ([a-zA-ZÅÄÖåäö]+)/, // matches "Se xxx", "se xxx", "See xxx" and "see xxx"
            (_, before, word) =>
              `${before} <a class="link" href="#${word.toLowerCase()}">${word}</a>`,
          ),
      };
    })
    .filter((row) => row !== null);
</script>

<article class="mx-auto max-w-screen-md">
  <ul>
    {#each wordList as word}
      <li
        id={word.definition?.toLowerCase()}
        class="scroll-m-24 rounded-xl p-2 transition-all target:bg-primary"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <b>{word.definition}</b> - {@html word.description}
      </li>
    {/each}
  </ul>
</article>
