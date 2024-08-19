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
  return []; // skips dynamic access policies like `markdowns:${name}:read`
};

const getImageUrls = (shortName: string) => ({
  lightImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/light.svg`,
  darkImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/dark.svg`,
  monoImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/bw.svg`,
  symbolUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/symbol/dark.svg`,
});

export const ACCESS_POLICIES = getObjectValues(apiNames).map(
  (apiName: string) => ({
    apiName,
    role: "*",
    studentId: null,
  }),
);

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
};
