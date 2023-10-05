import { Prisma } from "@prisma/client";
import apiNames from "../../src/lib/apiNames";

const accessData: Prisma.AccessPolicyCreateInput[] = [
  {
    apiName: apiNames.NEWS.CREATE,
    role: "dsek.styr",
  },
  {
    apiName: apiNames.NEWS.CREATE,
    role: "dsek.infu",
  },
  {
    apiName: apiNames.ACCESS_POLICY.READ,
    role: "dsek.infu.dwww",
  },
  {
    apiName: apiNames.ACCESS_POLICY.CREATE,
    role: "dsek.infu.dwww",
  },
  {
    apiName: apiNames.ACCESS_POLICY.UPDATE,
    role: "dsek.infu.dwww",
  },
  {
    apiName: apiNames.ACCESS_POLICY.DELETE,
    role: "dsek.infu.dwww",
  },
];

export default accessData;
