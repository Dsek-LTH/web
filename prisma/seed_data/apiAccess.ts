import { Prisma } from "@prisma/client";
import apiNames from "../../src/lib/apiNames";

const apiAccessData: Prisma.ApiAccessPolicyCreateInput[] = [
  {
    apiName: apiNames.NEWS_CREATE,
    role: "dsek.styr",
  },
  {
    apiName: apiNames.NEWS_CREATE,
    role: "dsek.infu",
  },
];

export default apiAccessData;
