import { Prisma } from '@prisma/client';

const apiAccessData: Prisma.ApiAccessPolicyCreateInput[] = [{
  apiName: 'news.create',
  role: 'dsek.styr',
},{
  apiName: 'news.create',
  role: 'dsek.infu',
}];

export default apiAccessData;