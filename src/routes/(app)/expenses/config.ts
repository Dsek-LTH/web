import * as messages from "$paraglide/messages";

export const COST_CENTRES = [
  {
    name: "AKTU01",
    description: messages.cost_centre_aktu_volunteer_description(),
    example: messages.cost_centre_aktu_volunteer_example(),
    signer: "dsek.aktu.mastare",
    committee: "aktu",
  },
  {
    name: "AKTU03",
    description: messages.cost_centre_aktu_utedischot_description(),
    example: messages.cost_centre_aktu_utedischot_example(),
    signer: "dsek.aktu.mastare",
    committee: "aktu",
  },
  {
    name: "AKTU04",
    description: messages.cost_centre_aktu_external_events_description(),
    example: messages.cost_centre_aktu_external_events_example(),
    signer: "dsek.aktu.mastare",
    committee: "aktu",
  },
  {
    name: "AKTU07",
    description: messages.cost_centre_aktu_events_description(),
    example: messages.cost_centre_aktu_events_example(),
    signer: "dsek.aktu.mastare",
    committee: "aktu",
  },
  {
    name: "AKTU08",
    description: messages.cost_centre_aktu_inventory_description(),
    example: messages.cost_centre_aktu_inventory_example(),
    signer: "dsek.aktu.mastare",
    committee: "aktu",
  },
  {
    name: "CAFE01",
    description: messages.cost_centre_cafe_volunteer_description(),
    example: messages.cost_centre_cafe_volunteer_example(),
    signer: "dsek.cafe.mastare",
    committee: "cafe",
  },
  {
    name: "CAFE02",
    description: messages.cost_centre_cafe_description(),
    example: messages.cost_centre_cafe_example(),
    signer: "dsek.cafe.mastare",
    committee: "cafe",
  },
  {
    name: "CAFE04",
    description: messages.cost_centre_cafe_events_description(),
    example: messages.cost_centre_cafe_events_example(),
    signer: "dsek.cafe.mastare",
    committee: "cafe",
  },
  {
    name: "CPU01",
    description: messages.cost_centre_cpu_description(),
    example: messages.cost_centre_cpu_example(),
    signer: "dsek.cpu.mastare",
    committee: "cpu",
  },
  {
    name: "FRA01",
    description: messages.cost_centre_framtid_description(),
    example: messages.cost_centre_framtid_example(),
    signer: "dsek.fram.ordf",
    committee: "fram",
  },
  {
    name: "INFU01",
    description: messages.cost_centre_infu_description(),
    example: messages.cost_centre_infu_example(),
    signer: "dsek.infu.mastare",
    committee: "infu",
  },
  {
    name: "INFU03",
    description: messages.cost_centre_shop_description(),
    example: messages.cost_centre_shop_example(),
    signer: "dsek.infu.mastare",
    committee: "infu",
  },
  {
    name: "KAL01",
    description: messages.cost_centre_källar_volunteers_description(),
    example: messages.cost_centre_källar_volunteers_example(),
    signer: "dsek.km.mastare",
    committee: "km",
  },

  {
    name: "KAL02",
    description: messages.cost_centre_root_description(),
    example: messages.cost_centre_root_example(),
    signer: "dsek.km.mastare",
    committee: "km",
  },

  {
    name: "KAL04",
    description: messages.cost_centre_källar_inventory_description(),
    example: messages.cost_centre_källar_inventory_example(),
    signer: "dsek.km.mastare",
    committee: "km",
  },
  {
    name: "MED01",
    description: messages.cost_centre_medaljelele_description(),
    example: messages.cost_centre_medaljelele_example(),
    signer: "dsek.overmarskalk",
    committee: "medalj",
  },
  {
    name: "NARU01",
    description: messages.cost_centre_näru_volunteers_description(),
    example: messages.cost_centre_näru_volunteers_example(),
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "NARU02",
    description: messages.cost_centre_näru_sponsorship_description(),
    example: messages.cost_centre_näru_sponsorship_example(),
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "NARU03",
    description: messages.cost_centre_alumni_group_description(),
    example: messages.cost_centre_alumni_group_example(),
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "NOLL01",
    description: messages.cost_centre_n0llu_volunteers_description(),
    example: messages.cost_centre_n0llu_volunteers_example(),
    signer: "dsek.noll.stab.oph",
    committee: "nollu",
  },
  {
    name: "NOLL02",
    description: messages.cost_centre_n0llu_materials_description(),
    example: messages.cost_centre_n0llu_materials_example(),
    signer: "dsek.noll.stab.oph",
    committee: "nollu",
  },
  {
    name: "NOLL03",
    description: messages.cost_centre_peppare_description(),
    example: messages.cost_centre_peppare_example(),
    signer: "dsek.noll.stab.oph",
    committee: "nollu",
  },
  {
    name: "NOLL04",
    description: messages.cost_centre_n0llu_events_description(),
    example: messages.cost_centre_n0llu_events_example(),
    signer: "dsek.noll.stab.oph",
    committee: "nollu",
  },
  {
    name: "SEKT01",
    description: messages.cost_centre_guild_volunteers_description(),
    example: messages.cost_centre_guild_volunteers_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT02",
    description: messages.cost_centre_guild_meetings_description(),
    example: messages.cost_centre_guild_meetings_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT03",
    description: messages.cost_centre_guild_thanksgiving_description(),
    example: messages.cost_centre_guild_thanksgiving_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT05",
    description: messages.cost_centre_guild_common_description(),
    example: messages.cost_centre_guild_common_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT06",
    description: messages.cost_centre_guild_administration_description(),
    example: messages.cost_centre_guild_administration_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT07",
    description: messages.cost_centre_guild_beverage_description(),
    example: messages.cost_centre_guild_beverage_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "SEKT08",
    description: messages.cost_centre_guild_funds_description(),
    example: messages.cost_centre_guild_funds_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "ALKO",
    description: messages.cost_centre_alcohol_description(),
    example: messages.cost_centre_alcohol_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX01",
    description: messages.cost_centre_sexet_volunteer_description(),
    example: messages.cost_centre_sexet_volunteer_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX02",
    description: messages.cost_centre_sexet_sittings_description(),
    example: messages.cost_centre_sexet_sittings_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX03",
    description: messages.cost_centre_sexet_pubs_description(),
    example: messages.cost_centre_sexet_pubs_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX04",
    description: messages.cost_centre_sexet_n0llegasque_description(),
    example: messages.cost_centre_sexet_n0llegasque_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX05",
    description: messages.cost_centre_sexet_skiphtesgasque_description(),
    example: messages.cost_centre_sexet_skiphtesgasque_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX06",
    description: messages.cost_centre_sexet_company_events_description(),
    example: messages.cost_centre_sexet_company_events_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX09",
    description: messages.cost_centre_sexet_utedischot_description(),
    example: messages.cost_centre_sexet_utedischot_example(),
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SKT01",
    description: messages.cost_centre_skatt_volunteers_description(),
    example: messages.cost_centre_skatt_volunteers_example(),
    signer: "dsek.skattm.mastare",
    committee: "skattm",
  },
  {
    name: "SKT02",
    description: messages.cost_centre_skatt_other_description(),
    example: messages.cost_centre_skatt_other_example(),
    signer: "dsek.skattm.mastare",
    committee: "skattm",
  },
  {
    name: "SRD01",
    description: messages.cost_centre_srd_volunteers_description(),
    example: messages.cost_centre_srd_volunteers_example(),
    signer: "dsek.srd.ordf",
    committee: "srd",
  },
  {
    name: "SRD02",
    description: messages.cost_centre_srd_events_description(),
    example: messages.cost_centre_srd_events_example(),
    signer: "dsek.srd.ordf",
    committee: "srd",
  },
  {
    name: "STYR01",
    description: messages.cost_centre_board_volunteers_description(),
    example: messages.cost_centre_board_volunteers_example(),
    signer: "dsek.skattm.mastare",
    committee: "other",
  },
  {
    name: "TACK01",
    description: messages.cost_centre_thanksgiving_summer_description(),
    example: messages.cost_centre_thanksgiving_summer_example(),
    signer: "dsek.tackm.mastare",
    committee: "tackm",
  },
  {
    name: "TACK02",
    description: messages.cost_centre_thanksgiving_winter_description(),
    example: messages.cost_centre_thanksgiving_winter_example(),
    signer: "dsek.tackm.mastare",
    committee: "tackm",
  },
  {
    name: "TEK01",
    description: messages.cost_centre_delta_volunteers_description(),
    example: messages.cost_centre_delta_volunteers_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "TEK02",
    description: messages.cost_centre_delta_events_description(),
    example: messages.cost_centre_delta_events_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "TEK03",
    description: messages.cost_centre_delta_marketing_description(),
    example: messages.cost_centre_delta_marketing_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },
  {
    name: "TEK04",
    description: messages.cost_centre_delta_logistics_description(),
    example: messages.cost_centre_delta_logistics_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },

  {
    name: "TEK05",
    description: messages.cost_centre_delta_sales_description(),
    example: messages.cost_centre_delta_sales_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },

  {
    name: "TEK06",
    description: messages.cost_centre_delta_autumn_description(),
    example: messages.cost_centre_delta_autumn_example(),
    // signer: "dsek.teknik.projgr.ansv", // we need to fix such that only Teknikfokusansvarig at the D-guild can sign
    signer: "dsek.nari.mastare",
    committee: "naru",
  },

  {
    name: "TRI01",
    description: messages.cost_centre_well_being_description(),
    example: messages.cost_centre_well_being_example(),
    signer: "dsek.triv.mastare",
    committee: "trivsel",
  },
  {
    name: "VAL01",
    description: messages.cost_centre_valleb_description(),
    example: messages.cost_centre_valleb_example(),
    signer: "dsek.val.ordf",
    committee: "valb",
  },
] as const;

export type CostCenter = (typeof COST_CENTRES)[number];
export type CostCenterName = (typeof COST_CENTRES)[number]["name"];

export const COST_CENTER_MAP = COST_CENTRES.reduce(
  (accumulator, cur) => {
    accumulator[cur.name] = cur;
    return accumulator;
  },
  {} as Record<CostCenterName, CostCenter>,
);
export const isValidCostCenter = (costCenterName: string) => {
  return costCenterName in COST_CENTER_MAP;
};

export const getCostCenter = (costCenterName: string) => {
  const center = COST_CENTER_MAP[costCenterName as CostCenterName];
  if (!center) throw new Error(messages.expenses_cost_centre_not_found());
  return center;
};

export const costCentres = [
  { label: messages.expenses_choose_cost_centre(), value: "" },
  ...COST_CENTRES.map((center) => ({
    label: `${center.name} - ${center.description} (${center.example})`,
    value: center.name,
  })),
];
