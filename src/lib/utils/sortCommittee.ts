import type { Committee, Position } from "@prisma/client";

export function sortBoardPos(
  posId1: Position["id"],
  posId2: Position["id"],
): number {
  const aIndex = boardOrder[posId1] ?? -1;
  const bIndex = boardOrder[posId2] ?? -1;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

export function sortCommitteePos(
  posId1: Position["id"],
  posId2: Position["id"],
  committeeShortName: Committee["shortName"],
): number {
  if (committeeShortName == null) return 1; // No committee? Assume pos B comes before
  const committee = committeePosOrder.get(committeeShortName);
  if (committee == null) return 1;
  const aIndex = committee[posId1] ?? -1;
  const bIndex = committee[posId2] ?? -1;
  if (aIndex === -1) return 1; // Pos A not found? Assume pos B comes before
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

const boardOrder: Readonly<Record<Position["id"], number>> = [
  "dsek.ordf",
  "dsek.vice_ordf",
  "dsek.skattm.mastare",
  "dsek.infu.mastare",
  "dsek.srd.ordf",
  "dsek.cafe.mastare",
  "dsek.nari.mastare",
  "dsek.km.mastare",
  "dsek.aktu.mastare",
  "dsek.sex.mastare",
  "dsek.noll.stab.oph",
].reduce<Record<Position["id"], number>>((acc, cur, i) => {
  acc[cur] = i;
  return acc;
}, {});

const committeePosOrder: ReadonlyMap<
  Exclude<Committee["shortName"], null>,
  Record<Position["id"], number>
> = new Map([
  [
    "other",
    [
      "dsek.ordf",
      "dsek.vice_ordf",
      "dsek.revisor",
      "dsek.talman",
      "dsek.juble.gen",
      "dsek.juble.mastare",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "skattm",
    [
      "dsek.skattm.mastare",
      "dsek.skattm.vice_mastare",
      "dsek.skattm.fm",
      "dsek.skattm.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "infu",
    [
      "dsek.infu.mastare",
      "dsek.infu.vice_mastare",
      "dsek.infu.dwww.mastare",
      "dsek.infu.dwww.mdlm",
      "dsek.infu.webmaster",
      "dsek.infu.fotograf",
      "old.dsek.infu.fotografdammig",
      "dsek.infu.filmare",
      "dsek.infu.artist",
      "dsek.infu.arkivarie",
      "dsek.infu.redaktor",
      "old.dsek.infu.readmeredaktos",
      "old.dsek.infu.ddu",
      "old.dsek.infu.wdredaktör",
      "old.dsek.vdredaktor",
      "old.dsek.infu.chefredaktör",
      "old.dsek.infu.redaktör",
      "dsek.infu.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "srd",
    [
      "dsek.srd.ordf",
      "dsek.srd.vice_ordf",
      "dsek.srd.srdsekreterare",
      "old.dsek.srd.arskursrepresentant",
      "old.dsek.srd.kurskommissarie",
      "old.dsek.srd.vicekurskommissarie",
      "old.dsek.srd.kursombudsansvarig",
      "old.dsek.srd.infotlth",
      "dsek.srd.instledrep",
      "dsek.srd.progledrep",
      "dsek.srd.husrepresentant",
      "old.dsek.srd.skyddskommitterepresentant",
      "old.dsek.srd.kinaansvarig",
      "dsek.srd.arskursrep.d1",
      "dsek.srd.arskursrep.c1",
      "dsek.srd.arskursrep.d2",
      "dsek.srd.arskursrep.c2",
      "dsek.srd.arskursrep.d3",
      "dsek.srd.arskursrep.c3",
      "dsek.srd.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "cafe",
    [
      "dsek.cafe.mastare",
      "dsek.cafe.vice_mastare",
      "dsek.cafe.dagsansv",
      "dsek.cafe.inventarieansv",
      "dsek.cafe.brunchansv",
      "dsek.cafe.stekare",
      "dsek.cafe.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "naru",
    [
      "dsek.nari.mastare",
      "old.dsek.nari.industrikontaktman",
      "dsek.nari.vice_mastare",
      "old.dsek.viceindustrikontakt",
      "dsek.teknik.projgr.ansv",
      "dsek.teknik.projgr.mdlm",
      "dsek.nari.mentorsansv",
      "dsek.nari.alu.ansv",
      "dsek.nari.alu.mdlm",
      "dsek.nari.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "km",
    [
      "dsek.km.mastare",
      "dsek.km.vice_mastare",
      "old.dsek.km.utflippadvicemastare",
      "dsek.km.rootm.root",
      "old.dsek.km.rootm.root",
      "dsek.km.rootm.vice_root",
      "dsek.km.rootm.sudo",
      "dsek.km.rootm.sparky",
      "dsek.km.ljudoljus",
      "dsek.km.bilansv",
      "dsek.km.tradgmstr",
      "old.dsek.km.sektionslivskvalitetsforhöjare",
      "dsek.km.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "aktu",
    [
      "dsek.aktu.mastare",
      "dsek.aktu.vice_mastare",
      "dsek.aktu.dischoansv",
      "dsek.aktu.idrottsfm",
      "dsek.aktu.dsportare",
      "dsek.aktu.karnevalsansv",
      "dsek.aktu.lanpartyansv",
      "dsek.aktu.sangstfm",
      "dsek.aktu.tandemgen",
      "dsek.aktu.semester",
      "dsek.aktu.markv",
      "dsek.aktu.vrdansansv",
      "dsek.aktu.smmstr",
      "dsek.aktu.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "sexm",
    [
      "dsek.sex.mastare",
      "dsek.sex.vice_mastare",
      "dsek.sex.hov.mstr",
      "dsek.sex.hov.sangfm",
      "dsek.sex.pub.mastare",
      "dsek.sex.pub.vice_mastare",
      "dsek.sex.bar.mstr",
      "old.dsek.sex.bartenders",
      "dsek.sex.bar.vice_mstr",
      "dsek.sex.kok.mstr",
      "dsek.sex.kok.vice_mstr",
      "dsek.sex.kok.prefmstr",
      "dsek.sex.olfm",
      "dsek.sex.vinfm",
      "dsek.sex.sektkock",
      "dsek.sex.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "nollu",
    [
      "dsek.noll.stab.oph",
      "old.dsek.noll.stab.oph",
      "dsek.noll.stab.mdlm",
      "old.dsek.nollu.staben",
      "dsek.noll.pepp.op",
      "dsek.noll.pepp.p",
      "dsek.noll.phadder",
      "dsek.noll.funk",
      "dsek.noll.uppdrag",
      "dsek.noll.pluggphadder",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "fram",
    ["dsek.fram.ordf", "dsek.fram.ledamot"].reduce<
      Record<Position["id"], number>
    >((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "dchip",
    [
      "dchip.ordf",
      "dchip.vice_ordf",
      "dchip.sekr",
      "dchip.revisor",
      "dchip.ekonomi",
      "dchip.infoansv",
      "dchip.nara",
      "dchip.event",
      "dchip.valb",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "medalj",
    [
      "dsek.overmarskalk",
      "dsek.inspektor",
      "dsek.medalj.mdlm",
      "dsek.medalj.funk",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "trivsel",
    [
      "dsek.triv.mastare",
      "dsek.triv.likbehombud",
      "dsek.triv.skyddsombud",
      "dsek.triv.varldsmstr",
      "dsek.triv.htf",
    ].reduce<Record<Position["id"], number>>((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {}),
  ],
  [
    "valb",
    ["dsek.val.ordf", "dsek.val.rep"].reduce<Record<Position["id"], number>>(
      (acc, cur, i) => {
        acc[cur] = i;
        return acc;
      },
      {},
    ),
  ],
]);
