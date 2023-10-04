import { Prisma } from "@prisma/client";

const positions: Prisma.PositionCreateInput[] = [
  {
    id: "dsek.ordf",
    name: "Ordförande",
  },
  {
    id: "dsek.infu.dwww.mastare",
    name: "DWWW-ansvarig",
  },
  {
    id: "dsek.infu.dwww.mdlm",
    name: "DWWW-medlem",
  },
  {
    id: "dsek.sex.funk",
    name: "Funktionär inom Sexmästeriet",
  },
];

export default positions;
