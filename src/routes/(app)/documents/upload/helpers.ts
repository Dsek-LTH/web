import { publicEnv } from "$lib/env/public";

export const typeToPath = {
  meeting: {
    path: (year: number, folder: string) => `public/${year}/${folder}`,
    bucket: publicEnv.PUBLIC_BUCKETS_DOCUMENTS,
  },
  srd: {
    path: (year: number, folder: string) => `public/srd/${year}/${folder}`,
    bucket: publicEnv.PUBLIC_BUCKETS_FILES,
  },
  requirement: {
    path: (year: number, folder: string) =>
      `public/kravprofiler/${year}/${folder}`,
    bucket: publicEnv.PUBLIC_BUCKETS_FILES,
  },
};
