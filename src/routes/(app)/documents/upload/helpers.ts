import {
	PUBLIC_BUCKETS_DOCUMENTS,
	PUBLIC_BUCKETS_FILES,
} from "$env/static/public";

export const typeToPath = {
	meeting: {
		path: (year: number, folder: string) => `public/${year}/${folder}`,
		bucket: PUBLIC_BUCKETS_DOCUMENTS,
	},
	srd: {
		path: (year: number, folder: string) => `public/srd/${year}/${folder}`,
		bucket: PUBLIC_BUCKETS_FILES,
	},
	requirement: {
		path: (year: number, folder: string) =>
			`public/kravprofiler/${year}/${folder}`,
		bucket: PUBLIC_BUCKETS_FILES,
	},
};
