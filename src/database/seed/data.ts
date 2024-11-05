import { fakerSV as faker } from "@faker-js/faker";
import { type SeedClientOptions } from "@snaplet/seed";
import dayjs from "dayjs";
import apiNames from "$lib/utils/apiNames";

const getObjectValues = (obj: unknown): string[] => {
  if (obj && typeof obj === "object") {
    return Object.values(obj).map(getObjectValues).flat();
  }
  if (typeof obj === "string") {
    return [obj];
  }
  return []; // dynamic access policies like `markdowns:${name}:read` are manually added
};

const getImageUrls = (shortName: string) => ({
  lightImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/light.svg`,
  darkImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/dark.svg`,
  monoImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/bw.svg`,
  symbolUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/symbol/dark.svg`,
});

export const DOORS = [
  { name: "border", verboseName: "Border" },
  { name: "ful", verboseName: "Fulförrådet" },
  { name: "buren", verboseName: "Buren" },
  { name: "idet", verboseName: "iDét" },
  { name: "koket", verboseName: "Köket" },
  { name: "komitea", verboseName: "Komitea" },
  { name: "mauer", verboseName: "Mauer (caféförrådet)" },
  { name: "sex", verboseName: "Sexförrådet" },
  { name: "stad", verboseName: "Städförrådet" },
  { name: "styrelserummet", verboseName: "Råsenbad (styrelserummet)" },
  { name: "utskott", verboseName: "Utskott" },
];

export const BOOKABLES = [
  { name: "Uppehållsdelen av iDét" },
  { name: "Köket" },
  { name: "Filmkamera" },
  { name: "Lysrör" },
  { name: "Sektionsbilen" },
  { name: "Lila Soundboks" },
  { name: "Råsa Soundboks" },
];

export const COMMITTEES = [
  { name: "Skattmästeriet", shortName: "skattm" },
  { name: "Informationsutskottet", shortName: "infu" },
  { name: "Studierådet", shortName: "srd" },
  { name: "Cafémästeriet", shortName: "cafe" },
  { name: "Näringslivsutskottet", shortName: "naru" },
  { name: "Källarmästeriet", shortName: "km" },
  { name: "Aktivitetsutskottet", shortName: "aktu" },
  { name: "Sexmästeriet", shortName: "sexm" },
  { name: "Nollningsutskottet", shortName: "nollu" },
  { name: "Framtidsutskottet", shortName: "fram" },
  { name: "D-chip", shortName: "dchip" },
  { name: "Medaljelelekommittén", shortName: "medalj" },
  { name: "Trivselrådet", shortName: "trivsel" },
  { name: "Valberedningen", shortName: "valb" },
].map((c) => ({ ...c, ...getImageUrls(c.shortName) }));

export const POLICYS = [
  "Policy för hantering av personuppgifter",
  "Policy för jämlikhet",
  "Policy för mötestider",
  "Policy för röstning",
  "Policy för samverkan med D-Chip",
  "Policy för sektionsbil",
  "Policy för styrdokument",
  "Policy för tackverksamhet",
  "Policy för val",
  "Policy för valberedningens arbete",
  "Policy för Alkohol och Droger",
  "Policy för Ekonomi",
];

export const GUIDELINES = [
  "Riktlinje för dansplattor",
  "Riktlinje för engelska titlar",
  "Riktlinje för grafisk profil",
  "Riktlinje för hantering av sektionens Facebooksidor",
  "Riktlinje för marknadsföring och prissättning",
  "Riktlinje för överlämning",
  "Riktlinje för sektionsbilens användning",
  "Riktlinje för anmodan och inbjudningar",
  "Strategisk plan",
];

export const MARKDOWNS = [
  ...COMMITTEES.map((committee) => ({ name: committee.shortName })),
  {
    name: "for-foretag",
    markdown:
      '[![](https://minio.api.dsek.se/news/public/b76f498a-ae6f-4af6-8273-f975bceceb05.png)\n](mailto:naringsliv@dsek.se)\n\n### [In English](https://www.dsek.se/info/for-companies)\n\n# SAMARBETSMÖJLIGHETER med D-sektionen inom LTH\n\nDet finns många olika sätt att vara en del av D-sektionen. Nedan finns en del alternativ för hur du kan kan synas för studenterna som studerar \nDatateknik eller Informations- och kommunikationsteknik. Har ni någon idé som ni inte ser här kan vi självklart skräddarsy ett evenemang som passar er!\n\n## Samarbete under Introduktionsveckorna\nDet finns många olika sätt att vara en del av D-sektionens introduktionsveckor i höst. Under introduktionsveckorna tar vi som sektion emot ca 230 nya studenter. \nUtöver det så brukar sektionen ha runt 200 funktionärer vilket är äldre studenter på linjen som väljer att hjälpa till och göra introduktionen så lätt\noch smidig som möjligt för de nya studenterna. Detta gör de 5 introduktionsveckorna till ett ypperligt tillfälle för företag att synas både för\natt locka intresset hos nya studenter men även att träffa de äldre studenterna.\n\n\n# EVENEMANG\n### **Lunchföreläsning**\n> Under en lunchföreläsning håller ni en föreläsning och\nberättar om ert företag och vilka möjligheter ni erbjuder.\nDetta är ett bra tillfälle att ta upp om ni söker sommarjobbare,\nexamensarbete, internship eller endast söker färdigutbildade.\nDetta sker under en lunch vilket är mellan 12:15 till 13:00.\nDet brukar delta mellan 80 - 100 studenter. Då det sker under\nlunchen så tar ni antingen med egen lunch till studenterna \neller så kan vi ordna maten, det handlar endast om vad som\nfunkar bäst för er. För detta event ingår marknadsföring.\n\n> **$** 15 000 kr + mat, Från 60 kr / person\n\n### **Pub**\n> Detta blir en kväll studenterna sent glömmer. Vi håller i en pub där vi serverar mat, öl och cider. Här kan ni även lägga önskemål på om ni vill ha någon speciell mat eller dryck som ska serveras under kvällen. Ett hett tips för dessa kvällar är att ha något tema eller till och med en tävling under kvällen. I början av kvällen får ni möjligheten att presentera er för studenterna där ni kan berätta om ert företag samt vilka möjligheter ni erbjuder. Detta är ett exceptionellt tillfälle för er att mingla med massor av studenter på sektionen. Det finns också möjlighet för er som företag att bjuda studenterna på alkoholfri dricka, t.ex. öl eller mocktails. Det brukar delta mellan 80-100 personer. För detta event ingår marknadsföring. \n \n> **$** 17 000 kr + mat, Från 50kr / person  \n\n> Bjud på alkoholfri dryck  \n **$** 30 kr / person\n\n### **Casekväll**\n> Detta är en kväll som kan anpassas efter era önskemål, t.ex. en casekväll eller en tävling. Studenterna får engagera sig i och extra kunskap kring det ämne ni önskar och ni marknadsför er samtidigt som företag. Vi erbjuder självklart hjälp med ideér och utformningen så ni får en kväll som stämmer överens med vad just ni vill få ut av eventet. Tidigare event har t.ex. varit tävlingar som penetrationstester av system som företag har skapat, snakebot och mycket annat. För detta event ingår marknadsföring.\n\n> **$** Enligt överenskommelse\n\n### **Esportsturnering**\n> Ett evenemang som har lockat många studenter ända sedan pandemin. Här har ni möjlighet att både interagera med studenter, och berätta om er själva under utsatta presentationstider. På livestreamen kan ni också placera er logga för att synas för alla tittare. För detta event ingår marknadsföring. Priset till vinnarna bestämmer ni som företag. Ni som företag kan även bidra med lag till turneringen.\n\n> **$** 13 000 kr\n\n# MARKNADSFÖRING\n\n### **Nollningshemsida**\n> Syns på nollningshemsidan 2023! Hemsidan kommer användas under introduktionsveckorna av de cirka 230 nya studenterna för att få information om schema och liknande. Som företag får ni en unik möjlighet att nå ut till alla nya studenter samtidigt genom att marknadsföra er på hemsidan.\n\n> **$** 12 000 kr\n\n### **Sociala medier**\n> D-sektionen har flera grupper och sidor på Facebook, Discord, Instagram och LinkedIn. Tack vare våra medlemsgrupper för samtliga medlemmar på D-sektionen samt vår sida "Näringslivsutskottet D-sektionen inom TLTH" når vi en väldigt varierad målgrupp. Vi har även möjlighet att nå alla som studerar via email-utskick. Vi hjälper dig med vilket val som passar just ert mål med marknadsföringen. \n\n> Medier:  \n**$** **Alla** 6 000 kr  \n**$** Facebook 2 000 kr  \n**$** Instagram 1 500 kr  \n**$** LinkedIn 1 500 kr  \n**$** Discord 1 500 kr  \n\n> Emailutskick:  \n**$** En årskurs 2 000 kr  \n**$** Två årskurser 3 500 kr  \n**$** Alla 5 000 kr  \n\n### **Affischering**\n> I vår byggnad har vi möjlighet att sätta upp affischer på\nvåra sju anslagstavlor som är strategiskt placerade på olika\nställen i huset. Affischerna är något som alla utskott på\nsektionen använder flitigt och är mycket synliga. Tryckkostnad ingår och vi kan\nsjälvklart även hjälpa er med design av affischen om det\nskulle önskas!\n\n> **$** 1 500 kr/vecka\n\n### **Monter** \n> Ni kan sätta upp en monter i huset vi håller\ntill i och låta studenter komma fram och\nprata med er. Speciellt under introduktions- veckorna är\ndet hög genomströmning av studenter i byggnaden och\ndetta ger er ett ypperligt tillfälle att få bra kontakt med \nstudenterna. Vi erbjuder även alternativet att stå\nnere i vår sektionslokal. Detta medför en direkt interaktion\nmed de som studerar Datateknik och InfoCom. I vår sektionslokal blir dessutom\nlättare för er som företag att få personlig\nkontakt med eleverna jämfört med i foajen.\n\n> **$** Lunch kl 12 - 13, 4 000 kr  \n**$** Halvdag kl 10 - 14, 6 000 kr  \n**$** Heldag kl 8 - 17, 8 000 kr  \n\n### **Nyhets-TV**\n> Få möjlighet att synas på vår nyhets-TV som sitter uppsatt i\nvår sektionslokal. Här ligger vårt Café och ett stort antal\nstudenter pluggar, värmer sin lunch och umgås här dagligen.\n Det är en perfekt möjlighet för er som företag att\nsynas för alla årskurser.\n\n> **$** 2 000 kr/vecka\n\n# MERCHANDISE\n### **Väska**\n> Ni som företag har möjligheten att placera din logga\nantingen på sidan eller framsida på nollornas nya väska.\nPlatserna är begränsade så att se till att säkra din företagslogga på årets väska!\n\n> **$** Framsida 30 000 kr  \n**$** Sida 25 000 kr  \n\n### **Pappersmuggar**\n> Få möjlighet att synas på pappmuggarna som används i\nvårt alldeles egna Café. Förutom att användas av alla som\nköper kaffe eller te kommer de alltid stå tillgängliga för studenter\natt använda på möten och medan de pluggar.\n\n> **$** 12 000 kr\n\n### **Övrig merch**\n> Vi kan tillsammans komma fram till andra möjligheter för\nmerch med ert företags tryck på. Exempel kan vara vattenflaskor, anteckningsblock eller kylväskor.\n\n> **$** Enligt överenskommelse\n\n# PAKET\n### **Skräddarsytt**\n> Med ett paket får ni möjlighet till ett större samarbete med sektionen, dessutom till \nett rabatterat pris.\n\n> **$** Enligt överrenskommelse',
    markdownEn:
      "[![](https://minio.api.dsek.se/news/public/b76f498a-ae6f-4af6-8273-f975bceceb05.png)\n](mailto:naringsliv@dsek.se)\n\n### [På svenska](https://www.dsek.se/info/for-foretag)\n\n# COLLABORATIONS with the D-guild at Lunds Tekniska Högskola\n\nThere are many ways to be a part of the D-guild. Below are some options for how you can show your company to students studying Computer Science or Information- and communication technology. If you have an idea that is not listed here, we can of course tailor an event that suits you.\n\n## Collaboration during the Introduction\nThere are many different ways to be a part of the D-guild’s introduction weeks this fall. During the introduction, our guild welcomes around 230 new students. In addition, the guild usually has around 200 volunteers, who are older students that offer to help and make the introduction pleasant and fun for the new students. This makes the introduction an excellent opportunity for companies to display themselves, both to attract the interest of new students, but also to meet the older students.\n\n\n# EVENT\n### **Lunch lecture**\n> During a lunch  lecture, you will give a presentation about your company and what opportunities you have to offer. This is a great opportunity if you are looking for summer workers, thesis work, internships or seeking graduates. This takes place during lunchtime, which is 12:15 to 13:00. Normally, between 80-100 students attend. As it takes place during lunchtime, you can either bring lunch yourselves to the students, or we can arrange food. Marketing is included for this event.\n\n> **$** 15 000 kr + food, from 60 kr / person\n\n### **Pub**\n> This will be an evening that the students will not soon forget. We will host a pub where we serve food, beer and cider. You can also make requests for any special food or drinks you want us to serve during the evening. A hot tip for these evenings is to have a theme or even a competition during the night. At the beginning of the evening, you will have the opportunity to introduce your company to the students and talk about the opportunities you offer. This is an exceptional opportunity for you to mingle with many students in the guild. There is also the opportunity for your company to offer non-alcoholic drinks, such as beer or mocktails, to the students. Usually, between 80-100 people attend. Marketing is included for this event.\n \n> **$** 17 000 kr + food, from 50kr / person  \n\n> Offer free non-alcoholic drinks\n **$** 30 kr / person\n\n### **Casenight**\n> This is an evening that can be tailored to your preferences, such as a case evening or a competition. The students can engage and gain extra knowledge on the subject of your choice while you promote your company. Of course, we offer assistance with ideas and design so that you get an evening that aligns with what you want to achieve from the event. Previous events have included competitions such as penetration testing of systems created by companies, snakebot, and much more. Marketing is included for this event.\n\n> **$** According to agreement\n\n### **E-sports tournament**\n> An event that has appealed to many students ever since the pandemic. Here, you have the opportunity to both interact with students, and tell them about your company during scheduled presentation times. You can have your logotype visible during the entire livestream. You determine the prize for the winners. You may also contribute with your own team for the tournament. Marketing is included for this event.\n\n> **$** 13 000 kr\n\n# MARKETING\n\n### **Introduction website**\n> Display your company on the introduction website. The website will be used during the introduction by around 230 new students to obtain information about the schedule and much more. As a company, you get the unique opportunity to reach out to all new students at once by marketing on the website.\n\n> **$** 12 000 kr\n\n### **Social media**\n> The D-guild has many groups and sites on Facebook, Discord, Instagram and LinkedIn. Thanks to our member-only groups and our page \"Näringslivsutskottet D-sektionen inom TLTH”, we reach a broad audience. We also offer the possibility to reach all of the students by email-blast. We can assist you in choosing the option that best suits your marketing goals.\n\n> Media:  \n**$** **All** 6 000 kr  \n**$** Facebook 2 000 kr  \n**$** Instagram 1 500 kr  \n**$** LinkedIn 1 500 kr  \n**$** Discord 1 500 kr   \n\n> Email blast:  \n**$** One grade 2 000 kr  \n**$** Two grades 3 500 kr  \n**$** All 5 000 kr  \n\n### **Poster advertising**\n> In our building we have the opportunity to put up posters on our seven bulletin boards that are strategically placed in various locations throughout the school. The posters are something that all committees at the guild use frequently and are highly visible. Printing costs are included, and we can, of course, also help you with the design of the posters if desired.\n\n> **$** 1 500 kr/week\n\n### **Booth**\n> You can set up a booth in the building where we are located and allow students to come talk to you. Especially during the introduction weeks, there is a high flow of students in the building, giving you an excellent opportunity to make good contact with them. We also offer the option of being downstairs in our guild's premises. This entails direct interaction with those who study Computer Science and Information and Communication Technology. In our guild's premises, it is also easier for your company to have personal contact with the students compared to in the foyer.\n\n> **$** Lunch 12:00 - 13:00, 4 000 kr  \n**$** Half day 10:00 - 14:00, 6 000 kr  \n**$** The entire day 8:00 - 17:00, 8 000 kr  \n\n### **News Display**\n> Get the opportunity to appear on our news display, which is located in our guild’s premises. Our cafe is located here and a large number of students study, heat their lunch, and socialize here daily. It is the perfect opportunity for your company to be seen by many students.\n\n> **$** 2 000 kr/week\n\n# MERCHANDISE\n### **Backpack**\n> As a company, you have the opportunity to place your logo on either the side or front of the new student's new backpack. The spots are limited, so make sure to secure a spot for your company logo on this year’s backpack!\n\n> **$** Front 30 000 kr  \n**$** Side 25 000 kr  \n\n### **Paper cups**\n> Get the opportunity to market your company on the paper cups that are used in our very own café. Besides being used by everyone who buys coffee or tea, they will always be available for students to use during meetings and while studying.\n\n> **$** 12 000 kr\n\n### **Other merchandise**\n> We can explore other possibilities for merchandise with your company's logo. Examples could include water bottles, notepads, or cooler bags.\n\n> **$** According to agreement\n\n# PACKAGE\n### **Tailored to your preferences**\n> With a package, you will have the opportunity for a larger collaboration with the section, as well as at a discounted price.\n\n> **$** According to agreement",
  },
  ...[
    "hjalp",
    "privacy-policy",
    "access",
    "for-companies",
    "other",
    "benefits",
    "sektionspub",
    "htm1",
    "readme",
    "dkontakt",
    "sight",
    "contact",
    "familjefoto",
  ].map((name) => ({ name })),
] as const;

export const ACCESS_POLICIES = [
  ...getObjectValues(apiNames),
  ...getObjectValues(
    MARKDOWNS.map((markdown) => apiNames.MARKDOWNS.PAGE(markdown.name)),
  ),
  ...getObjectValues(
    Array.from({ length: 5 }, (_, i) =>
      apiNames.MARKDOWNS.PAGE(`cafe:open:${i}`),
    ),
  ),
].map((apiName: string) => ({
  apiName,
  role: "*",
  studentId: null,
}));

export const models: SeedClientOptions["models"] = {
  member: {
    data: {
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      bio: () => faker.helpers.maybe(() => faker.person.bio()) ?? null,
      classProgramme: () => faker.helpers.arrayElement(["C", "D"]),
      classYear: () =>
        faker.number.int({
          min: 1962,
          max: new Date().getFullYear(),
        }),
      studentId: (ctx) =>
        `${ctx.data.firstName?.substring(0, 2).toLowerCase()}${faker.number.int({ min: 1000, max: 9999 })}${ctx.data.lastName?.substring(0, 2).toLowerCase()}-s`,
      picturePath: () => faker.image.avatar(),
      email: (ctx) =>
        `${ctx.data.firstName?.toLowerCase()}.${ctx.data.lastName?.toLowerCase()}.${ctx.data.studentId?.substring(2, 6)}@user.dsek.se`,
      nickname: () =>
        faker.helpers.maybe(() => faker.hacker.adjective()) ?? null,
      foodPreference: () =>
        faker.helpers.maybe(() =>
          faker.helpers.arrayElement(["Vegetarian", "Vegan"]),
        ) ?? null,
      visible: true,
      stripeCustomerId: null,
      nollningGroupId: null,
    },
  },
  article: {
    data: {
      body: () => faker.lorem.paragraphs({ min: 3, max: 10 }),
      header: () => faker.lorem.sentence(),
      createdAt: () => faker.date.past(),
      publishedAt: (ctx) => ctx.data.createdAt ?? faker.date.past(),
      slug: (ctx) => faker.helpers.slugify(ctx.data.header),
      removedAt: null,
      imageUrl: faker.helpers.maybe(() => faker.image.url()),
    },
  },
  articleComment: {
    data: {
      content: () => faker.lorem.sentence(),
      published: () => faker.date.past(),
    },
  },
  event: {
    data: {
      title: () => faker.lorem.sentence(),
      description: () => faker.lorem.paragraphs({ min: 3, max: 6 }),
      startDatetime: () =>
        faker.helpers.maybe(() => faker.date.soon({ days: 60 })) ??
        faker.date.recent({ days: 60 }),
      endDatetime: (ctx) =>
        dayjs(ctx.data.startDatetime)
          .add(faker.number.int({ min: 1, max: 5 }), "hour")
          .toDate(),
      slug: (ctx) => faker.helpers.slugify(ctx.data.title),
      shortDescription: () => faker.lorem.sentence(),
      alarmActive: false,
      removedAt: null,
      imageUrl: null,
    },
  },
  doorAccessPolicy: {
    data: {
      role: "dsek",
      startDatetime: () => faker.helpers.maybe(() => faker.date.past()) ?? null,
      endDatetime: (ctx) =>
        ctx.data.startDatetime && Math.random() > 0.5
          ? faker.date.future()
          : null,
    },
  },
  committee: {
    data: {
      description: null,
    },
  },
  position: {
    data: {
      name: () => faker.person.jobTitle(),
      nameEn: () => faker.person.jobTitle(),
      description: () => faker.lorem.paragraph(),
      email: (ctx) =>
        faker.internet
          .email({
            firstName: ctx.data.name,
            lastName: "",
            provider: "dsek.se",
          })
          .toLowerCase(),
      boardMember: () => Math.random() > 0.9,
      active: true,
    },
  },
  mandate: {
    data: {
      startDate: () => faker.date.past(),
      endDate: (ctx) => dayjs(ctx.data.startDate).endOf("year").toDate(),
    },
  },
  bookingRequest: {
    data: {
      start: () => faker.date.soon({ days: 60 }),
      end: (ctx) =>
        dayjs(ctx.data.start)
          .add(faker.number.int({ min: 1, max: 5 }), "hour")
          .toDate(),
      event: () => faker.lorem.sentence(),
    },
  },
  document: {
    data: {
      url: () => `policys/releases/download/latest/${faker.system.fileName()}`,
      deletedAt: null,
    },
  },
  markdown: {
    data: {
      markdown: () => faker.lorem.paragraphs({ min: 3, max: 6 }),
      markdownEn: () => faker.lorem.paragraphs({ min: 3, max: 6 }),
    },
  },
  song: {
    data: {
      title: () => faker.music.songName(),
      melody: () => faker.lorem.sentence(),
      lyrics: () => faker.lorem.paragraphs({ min: 3, max: 6 }),
      category: () => faker.music.genre(),
      deletedAt: null,
    },
  },
};
