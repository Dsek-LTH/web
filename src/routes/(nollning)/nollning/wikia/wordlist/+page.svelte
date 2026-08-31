<script lang="ts">
  // As to avoid cluttering up the translation file, all words in the word list are part of a single translation value
  // The format is like this: Definition - description\nDefinition - description
  import { locales, getLocale } from "$paraglide/runtime";
  type Lang = (typeof locales)[number];

  // TODO: Translate

  const wordBank: Array<{ sv: string } & Partial<Record<Lang, string>>> = [
    {
      sv: "AFB - Förser studenterna med studentbostäder.",
      en: "AFB - Provides students with housing.",
    },
    {
      sv: "AF-borgen - Plats för bal och spex.",
      en: "AF-borgen - Venue for balls and student theater.",
    },
    { sv: "Cheps - Definition saknas...", en: "Cheps - Definition missing..." },
    { sv: "CSN - 🤑🤑🤑.", en: "CSN - 🤑🤑🤑 (Student financial aid)." },
    {
      sv: "Delphi - Lunds studentghetto.",
      en: "Delphi - Lund's student ghetto.",
    },
    {
      sv: "Delphivrål - Ångestfyllt, hjärtskärande, utdraget vrål som kan höras runt Delphi med omnejd kl. 23.00 under tentaveckorna.",
      en: "Delphi scream - A stressed, heart-wrenching, prolonged scream heard around Delphi at 23:00 during exam weeks.",
    },
    {
      sv: "D - Fjärde bokstaven i alfabetet.",
      en: "D - The fourth letter of the alphabet.",
    },
    {
      sv: "Datagården - fjärde gården på Kämnärsrätten, många D:are bor/bodde där.",
      en: "Datagården - The fourth courtyard at Kämnärsrätten, where many D-guild members live/lived.",
    },
    {
      sv: "D:are  - Person på D-sektionen.",
      en: "D:are - A member of the D-guild.",
    },
    { sv: "D-café - Vårt café i iDét.", en: "D-café - Our café in iDét." },
    {
      sv: "D-huset - Byggnaden där D:are spenderar mestadelen av sin tid på campus.",
      en: "D-huset - The building where D-guild members spend most of their time on campus.",
    },
    {
      sv: "D-sektionen - Den bästa sektionen.",
      en: "D-sektionen - The best guild.",
    },
    {
      sv: "Eftersläpp - Klubb som öppnas efter sittning.",
      en: "Eftersläpp - A club that opens after a sitting.",
    },
    {
      sv: "E-huset - En felstavning av D-huset.",
      en: "E-huset - A misspelling of D-huset.",
    },
    { sv: "Gasque - Finare sittning.", en: "Gasque - A more formal sitting." },
    {
      sv: "Gyckle - Kort scenframträdande. Görs alltid två stycken innan man får lämna scen.",
      en: "Gyckle - A short stage performance. Always done twice before leaving the stage.",
    },
    {
      sv: "Högtidsdräkt - Se <a href='/nolla/packing#kladkod'>klädkoder</a>.",
      en: "Formal attire - See <a href='/nolla/packing#kladkod'>dress codes</a>.",
    },
    { sv: "iDét - Vårt hem i D-huset.", en: "iDét - Our home in D-huset." },
    {
      sv: "Inspektor - Äldre och klokare person som rådgiver sektionen.",
      en: "Inspektor - An older and wiser person who advises the guild.",
    },
    {
      sv: "Kämnärsrätten - Nordligt lägenhetsområde nära Willys.",
      en: "Kämnärsrätten - A northern apartment area near Willys.",
    },
    {
      sv: "LED - Ett café i D-huset som tror de är något. Läsare rekommenderas att gå till D-café istället.",
      en: "LED - A café in D-huset that thinks it's something. Readers are recommended to go to D-café instead.",
    },
    {
      sv: "Lila - Vår andra sektionsfärg, #9966CC ;)",
      en: "Purple - Our second guild color, #9966CC ;)",
    },
    {
      sv: "N0llan - Teknolog i träningsphasen.",
      en: "N0llan - A technology student in the training phase.",
    },
    {
      sv: "Nation - Fritidsförening som anordnar klubbar och annat skojsigt.",
      en: "Nation - A leisure club that organizes parties and other fun activities.",
    },
    {
      sv: "Nollegasque - Den stora avslutande sittningen på nollningen.",
      en: "Nollegasque - The grand final sitting during nollningen.",
    },
    {
      sv: "Nollegeneral - Nollningens general.",
      en: "Nollegeneral - The general of nollningen.",
    },
    {
      sv: "Ouvve - Ouverall. Teknologens favoritplagg.",
      en: "Ouvve - Overall. The favorite garment of technology students.",
    },
    { sv: "Peppare - Håller i nollningen.", en: "Peppare - Leads nollningen." },
    { sv: "Ph - Förkortning av 'f'.", en: "Ph - Abbreviation of 'f'." },
    { sv: "PH - D-husets superman", en: "PH - Superman of the D-house" },
    {
      sv: "Phadder - Din männskliga guide till studentlivet.",
      en: "Phadder - Your human guide to student life.",
    },
    { sv: "Rekursion - se Rekursion.", en: "Recursion - see Recursion." },
    {
      sv: "Råsa - Vår sektionsfärg, #F280A1 ;)",
      en: "Råsa (Pink) - Our guild color, #F280A1 ;)",
    },
    {
      sv: "Råsenbad - Rum i iDét där styrelsen styr, ledarna leder och möten möts.",
      en: "Råsenbad - A room in iDét where the board rules, leaders lead, and meetings meet.",
    },
    {
      sv: "Shäraton - Ett litet mysrum i iDét med brädspel, TV-spel och soffor.",
      en: "Shäraton - A cozy little room in iDét with board games, video games, and sofas.",
    },
    {
      sv: "Sjungbok - Så du kan hänga med i svängarna, också anteckningsblock på sittningar.",
      en: "Sjungbok - So you can keep up with the songs, also used as a notebook at sittings.",
    },
    {
      sv: "Sjön Sjøn - Sjön runt ön Øn. En uppfriskande simtur uppskattas, glöm bara inte skorna och att hålla munnen jättestängd.",
      en: "Sjön Sjøn - The lake around the island Øn. A refreshing swim is recommended, just don't forget your shoes and to keep your mouth tightly closed.",
    },
    {
      sv: "Slasque - Fulare sittning med Ouvve.",
      en: "Slasque - A more casual sitting with Ouvve.",
    },
    {
      sv: "Sparta  - Studentghetto i Lund där folk lever enkelt utan onödig lyx.",
      en: "Sparta - A student ghetto in Lund where people live simply without unnecessary luxury.",
    },
    {
      sv: "Spex - En studentikos musikal framförd av andra LU studenter.",
      en: "Spex - A student musical performed by other LU students.",
    },
    {
      sv: "Spex - En studentförening som anordnar spex.",
      en: "Spex - A student organization that organizes spex.",
    },
    {
      sv: "Spex - Vad vissa andra sektioner kallar gyckel. Se Gyckel.",
      en: "Spex - What some other guilds call gyckel. See Gyckel.",
    },
    {
      sv: "Studentikost - (OBS! Inte kost som i mat, utan uttalas kåååst) Något som bara en student skulle göra.",
      en: "Studentikost - (Note: Not 'kost' as in food, but pronounced 'kåååst') Something only a student would do.",
    },
    {
      sv: "Sångbok - Felstavning, se Sjungbok.",
      en: "Sångbok - Misspelling, see Sjungbok.",
    },
    {
      sv: "Teknologmössa - Teknologens jättefina huvudbonad med en jättevacker spegatklädd tofs. Får enbart bäras av ettor och äldre.",
      en: "Teknologmössa - The technology student's beautiful headgear with a beautiful braided tassel. Can only be worn by first-years and older.",
    },
    {
      sv: "Kiosken Kiosken - Den numera ickefungerande kommunikationshytten på ön Øn.",
      en: "Kiosken Kiosken - The now non-functional communication booth on the island Øn.",
    },
    { sv: "Tenta - Se Ångest.", en: "Exam - See Anxiety." },
    {
      sv: "TLTH - Kåren på LTH, den förening som sammanbinder alla sektioner.",
      en: "TLTH - The student union at LTH, the organization that connects all guilds.",
    },
    { sv: "Ångest - Se Tenta.", en: "Anxiety - See Exam." },
    { sv: "Ø - Förkortning av 'Ö'.", en: "Ø - Abbreviation of 'Ö'." },
    {
      sv: "ön Øn - Ön i mitten av sjön Sjøn. Oftast obebodd, utom under Regattan, då den är så överbefolkad att den nästan sjunker.",
      en: "ön Øn - The island in the middle of Sjön Sjøn. Usually uninhabited, except during Regatta, when it’s so overcrowded it almost sinks.",
    },
    {
      sv: "Øverpeppare - Pepparnas mamma och pappa.",
      en: "Øverpeppare - The parents of the Peppare.",
    },
  ];
  const wordList = wordBank
    .map((item) => {
      const word = item[getLocale()];
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
