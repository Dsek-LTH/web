// AUTO-GENERATED from @preview/dsek's src/lib/assets/strings.typ.
// Regenerate when the pinned package version changes (see DSEK_PACKAGE_VERSION).
// Source: https://github.com/Dsek-LTH/dsek-typst

export type Position = { key: string; label: string; labelEn: string };
export type PositionGroup = {
  key: string;
  label: string;
  labelEn: string;
  positions: Position[];
};

export const POSITION_GROUPS: PositionGroup[] = [
  {
    key: "styr",
    label: "Styrelsen",
    labelEn: "The Board",
    positions: [
      { key: "ordf", label: "Ordförande", labelEn: "President" },
      { key: "sordf", label: "Sektionsordförande", labelEn: "Guild President" },
      { key: "vice_ordf", label: "Vice ordförande", labelEn: "Vice President" },
      {
        key: "vice_sordf",
        label: "Vice sektionsordförande",
        labelEn: "Vice Guild President",
      },
    ],
  },
  {
    key: "aktu",
    label: "Aktivitetsutskottet",
    labelEn: "The Recreation Committee",
    positions: [
      {
        key: "ansv",
        label: "Aktivitetsansvarig",
        labelEn: "Head of Recreation",
      },
      {
        key: "vice_ansv",
        label: "Vice Aktivitetsansvarig",
        labelEn: "Vice Head of Recreation",
      },
      {
        key: "utedischoansv",
        label: "UtEDischoansvarig",
        labelEn: "UtEDischo Manager",
      },
      {
        key: "idrottsfm",
        label: "Idrottsförman",
        labelEn: "Head of Sports Events",
      },
      {
        key: "dsportare",
        label: "D-sportare",
        labelEn: "Tournament Organizer",
      },
      {
        key: "karnevalsansv",
        label: "Karnevalsansvarig",
        labelEn: "Lundakarnevalen Representative",
      },
      {
        key: "lanpartyansv",
        label: "LAN-partyansvarig",
        labelEn: "LAN-party Coordinator",
      },
      { key: "semester", label: "Semesterfirare", labelEn: "Holidaymaker" },
      {
        key: "sasfm",
        label: "Sångarstridsförman",
        labelEn: "TLTH Song Contest Team Captain",
      },
      {
        key: "tandemgen",
        label: "Tandemgeneral",
        labelEn: "Tandem Relay Team Captain",
      },
      { key: "nojesfm", label: "Nöjesförman", labelEn: "Chief of Joy" },
      { key: "coach", label: "Coach", labelEn: "Coach" },
    ],
  },
  {
    key: "infu",
    label: "Informationsutskottet",
    labelEn: "The Communications Committee",
    positions: [
      {
        key: "ansv",
        label: "Informationsansvarig",
        labelEn: "Head of Communications",
      },
      {
        key: "vice_ansv",
        label: "Vice Informationsansvarig",
        labelEn: "Vice Head of Communications",
      },
      { key: "fotograf", label: "Fotograf", labelEn: "Photographer" },
      { key: "filmare", label: "Filmare", labelEn: "Filmmaker" },
      { key: "arkivarie", label: "Arkivarie", labelEn: "Archivist" },
      { key: "artist", label: "Artist", labelEn: "Artist" },
      { key: "influencer", label: "Influencer", labelEn: "Influencer" },
      { key: "journalist", label: "Journalist", labelEn: "Journalist" },
      { key: "redaktor", label: "Redaktör", labelEn: "Editor" },
      { key: "shopaholic", label: "Shopaholic", labelEn: "Shopaholic" },
      { key: "skald", label: "Skald", labelEn: "Bard" },
      { key: "markv", label: "Märkvärdig", labelEn: "Patchy" },
    ],
  },
  {
    key: "cafe",
    label: "Cafémästeriet",
    labelEn: "The Café Committee",
    positions: [
      { key: "mastare", label: "Cafémästare", labelEn: "Head of the Café" },
      {
        key: "vice_mastare",
        label: "Vice cafémästare",
        labelEn: "Vice Head of the Café",
      },
      { key: "dagsansv", label: "Dagsansvarig", labelEn: "Daycarer" },
      {
        key: "inventarieansv",
        label: "Inventarieansvarig",
        labelEn: "Stockpiler",
      },
      { key: "stekare", label: "Stekare", labelEn: "Grillmaster" },
      { key: "brunchm", label: "Brunchmästare", labelEn: "Head of Brunch" },
      { key: "bakis", label: "Bakis", labelEn: "Baked" },
    ],
  },
  {
    key: "skattm",
    label: "Skattmästeriet",
    labelEn: "The Treasury",
    positions: [
      { key: "mastare", label: "Skattmästare", labelEn: "Treasurer" },
      {
        key: "vice_mastare",
        label: "Vice Skattmästare",
        labelEn: "Vice Treasurer",
      },
      { key: "fm", label: "Skattförman", labelEn: "Treasury Foreman" },
    ],
  },
  {
    key: "fram",
    label: "Framtidsutskottet",
    labelEn: "The Strategic Committee",
    positions: [
      {
        key: "ordf",
        label: "Framtidsordförande",
        labelEn: "Head of the Strategic Committee",
      },
      {
        key: "ledamot",
        label: "Framtidsledamot",
        labelEn: "Member of the Strategic Committee",
      },
    ],
  },
  {
    key: "km",
    label: "Källarmästeriet",
    labelEn: "The Facilities Committee",
    positions: [
      { key: "mastare", label: "Källarmästare", labelEn: "Head of Facilities" },
      {
        key: "vice_mastare",
        label: "Vice källarmästare",
        labelEn: "Vice Head of Facilities",
      },
      { key: "bilansv", label: "Bilansvarig", labelEn: "Guild Car Mechanic" },
      {
        key: "ljudoljus",
        label: "Ljud- och ljusansvarig",
        labelEn: "Audiovisual Technician",
      },
      { key: "tradgm", label: "Trädgårdsmästare", labelEn: "Gardener" },
    ],
  },
  {
    key: "nollu",
    label: "Nollningsutskottet",
    labelEn: "The Introductions Committee",
    positions: [
      {
        key: "oph",
        label: "Øverphøs",
        labelEn: "Head of the Introductions Committee",
      },
      {
        key: "stab",
        label: "Stabsmedlem",
        labelEn: "Member of the Introductions Committee",
      },
      {
        key: "opepp",
        label: "Øverpeppare",
        labelEn: "Head of Introduction Coordinators",
      },
      { key: "pepp", label: "Peppare", labelEn: "Introduction Coordinator" },
      { key: "phadder", label: "Phadder", labelEn: "Mentor" },
      { key: "pluggphadder", label: "Pluggphadder", labelEn: "Study Mentor" },
    ],
  },
  {
    key: "naru",
    label: "Näringslivsutskottet",
    labelEn: "The Corporate Relations Committee",
    positions: [
      {
        key: "ansv",
        label: "Näringslivsansvarig",
        labelEn: "Head of Corporate Relations",
      },
      {
        key: "vice_ansv",
        label: "Vice näringslivsansvarig",
        labelEn: "Vice Head of Corporate Relations",
      },
      {
        key: "alumniansv",
        label: "Alumnigruppsansvarig",
        labelEn: "Head of the Alumni Committee",
      },
      {
        key: "aulmnimdlm",
        label: "Alumnigruppsmedlem",
        labelEn: "Member of the Alumni Committee",
      },
      {
        key: "koordinator",
        label: "Näringslivskoordinator",
        labelEn: "Corporate Relations Coordinator",
      },
      {
        key: "deltag",
        label: "DELTA-general",
        labelEn: "DELTA Project Manager",
      },
      {
        key: "deltapr",
        label: "DELTA-projektledare",
        labelEn: "Member of the DELTA Project Group",
      },
      { key: "deltav", label: "DELTA-general", labelEn: "DELTA Host" },
    ],
  },
  {
    key: "sexm",
    label: "Sexmästeriet",
    labelEn: "The Festivities Committee",
    positions: [
      { key: "mastare", label: "Sexmästare", labelEn: "Head of Festivities" },
      {
        key: "vice_mastare",
        label: "Vice sexmästare",
        labelEn: "Vice Head of Festivities",
      },
      { key: "barm", label: "Barmästare", labelEn: "Bartender" },
      { key: "vbarm", label: "Vice barmästare", labelEn: "Vice Bartender" },
      { key: "pubm", label: "Pubmästare", labelEn: "Head of Pubs" },
      { key: "vpubm", label: "Vice pubmästare", labelEn: "Vice Head of Pubs" },
      { key: "hovm", label: "Hovmästare", labelEn: "Maître D'guild" },
      { key: "sangfm", label: "Sångförman", labelEn: "Toastmaster" },
      { key: "kokm", label: "Köksmästare", labelEn: "Head chef" },
      { key: "vkokm", label: "Vice köksmästare", labelEn: "Sous chef" },
      { key: "prefm", label: "Preferensmästare", labelEn: "Preferences chef" },
      { key: "olfm", label: "Ölförman", labelEn: "Beer Boss" },
      { key: "vinfm", label: "Vinförman", labelEn: "Wine Warden" },
      {
        key: "tappad",
        label: "TappaD",
        labelEn: "Beer Boss in charge of Draft",
      },
      { key: "sektkock", label: "Sektionskock", labelEn: "Guild Cook" },
    ],
  },
  {
    key: "srd",
    label: "Studierådet",
    labelEn: "The Student Council",
    positions: [
      {
        key: "ordf",
        label: "Studierådsordförande",
        labelEn: "Head of the Student Council",
      },
      {
        key: "vice_ordf",
        label: "Vice studierådsordförande",
        labelEn: "Vice Head of the Student Council",
      },
      {
        key: "sekr",
        label: "Studierådssekreterare",
        labelEn: "Secretary of the Student Council",
      },
      {
        key: "progledrep",
        label: "Programledningsrepresentant",
        labelEn: "Student Representative of Program Management",
      },
      {
        key: "instledrep",
        label: "Institutionsledningsrepresentant",
        labelEn: "Student Representative of the Department Board",
      },
      {
        key: "husrep",
        label: "Husrepresentant",
        labelEn: "Student Representative of the House Board",
      },
      {
        key: "arskursrep",
        label: "Årskursrepresentant",
        labelEn: "Class Representative",
      },
    ],
  },
  {
    key: "cpu",
    label: "Centralprocessutskottet",
    labelEn: "The Central Processing Unit",
    positions: [
      { key: "mastare", label: "Processmästare", labelEn: "Head Processor" },
      {
        key: "vice_mastare",
        label: "Vice Processmästare",
        labelEn: "Subprocessor",
      },
      { key: "dwwwansv", label: "DWWW-ansvarig", labelEn: "Head of DWWW" },
      { key: "root", label: "root", labelEn: "root" },
      { key: "utvecklare", label: "Utvecklare", labelEn: "Developer" },
    ],
  },
  {
    key: "medalj",
    label: "Medeljelelekommitén",
    labelEn: "The Honours Committee",
    positions: [
      { key: "omslk", label: "Øvermarskalk", labelEn: "Master of Ceremonies" },
      {
        key: "mdlm",
        label: "Medaljelelekommitémedlem",
        labelEn: "Member of the Honours Committee",
      },
    ],
  },
  {
    key: "valb",
    label: "Valberedningen",
    labelEn: "The Nomination Committee",
    positions: [
      {
        key: "ordf",
        label: "Valberedningens ordförande",
        labelEn: "Head of the Nomination Committee",
      },
      {
        key: "rep",
        label: "Valberedningsrepresentant",
        labelEn: "Member of the Nomination Committee",
      },
    ],
  },
  {
    key: "tackm",
    label: "Tackmästeriet",
    labelEn: "The Thanksgiving Committee",
    positions: [
      {
        key: "mastare",
        label: "Tackmästare",
        labelEn: "Head of the Thanksgiving Committee",
      },
      {
        key: "mdlm",
        label: "Tackmästerist",
        labelEn: "Member of the Thanksgiving Committee",
      },
    ],
  },
  {
    key: "triv",
    label: "Trivselrådet",
    labelEn: "The Student Well-being Committee",
    positions: [
      {
        key: "mastare",
        label: "Trivselmästare",
        labelEn: "Head of Student Well-being",
      },
      {
        key: "likbehombud",
        label: "Likabehandlingsombud",
        labelEn: "Equal Opportunities Representative",
      },
      {
        key: "skyddsombud",
        label: "Skyddsombud",
        labelEn: "Student Safety Representative",
      },
      { key: "varldsm", label: "Världsmästare", labelEn: "World Master" },
    ],
  },
  {
    key: "otherpos",
    label: "Övriga",
    labelEn: "Other",
    positions: [
      { key: "inspektor", label: "Inspektor", labelEn: "Inspector" },
      { key: "revisor", label: "Revisor", labelEn: "Auditor" },
      { key: "talman", label: "Talman", labelEn: "Assembly speaker" },
      {
        key: "jublegeneral",
        label: "Jubileumsgeneral",
        labelEn: "Head of the Anniversary Committee",
      },
      {
        key: "jubleansv",
        label: "Jubileumsansvarig",
        labelEn: "Member of the Anniversary Committee",
      },
    ],
  },
];

/** Flat list of every position, with its Typst key path (`group.key`). */
export const ALL_POSITIONS: Array<{
  path: string;
  label: string;
  labelEn: string;
  group: string;
  groupEn: string;
}> = POSITION_GROUPS.flatMap((g) =>
  g.positions.map((p) => ({
    path: `${g.key}.${p.key}`,
    label: p.label,
    labelEn: p.labelEn,
    group: g.label,
    groupEn: g.labelEn,
  })),
);
