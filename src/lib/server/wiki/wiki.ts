import { PUBLIC_MEDIAWIKI_ENDPOINT } from "$env/static/public";
import { env } from "$env/dynamic/private";
import { withCache } from "$lib/utils/cache";

export interface WikiChangeItem {
	type: string;
	ns: number;
	title: string;
	pageid: number;
	revid: number;
	comment: string;
	parsedcomment: string;
	timestamp: string;
	user: string;
}

export interface WikiExtractItem {
	pageid: number;
	ns: number;
	title: string;
	extract: string;
}

export type WikiDataItem = WikiChangeItem & WikiExtractItem;

const CACHE_INTERVAL = 1 * 60; // 5 minutes

async function getWikiData(): Promise<WikiDataItem[]> {
	console.log("getWikiData runs");

	let wikiData: WikiDataItem[] = [];
	const loginResponse = await wikiLoginToken();
	if (loginResponse) {
		const { loginToken, cookies: loginCookies } = loginResponse;

		const {
			cookies,
			data: { login },
		} = await wikiLoginSession(
			env.MEDIAWIKI_USERNAME,
			env.MEDIAWIKI_PASSWORD,
			loginToken,
			loginCookies,
		);

		if (login.result == "Failed") {
			console.log(
				`MediaWiki error: '${login.reason}' The login details are most likely wrong`,
			);
			return [];
		}
		const wikiChanges = await wikiApiRecentChanges(cookies);
		let changes = wikiChanges.query.recentchanges;
		let rccontinue: string | null = wikiChanges.continue.rccontinue;
		const removeChangesDuplicates = () =>
			changes.filter(
				(v, i) => changes.findIndex(({ pageid }) => v.pageid == pageid) == i,
			);
		changes = removeChangesDuplicates();

		while (changes.length < 3 && rccontinue) {
			const moreWikiChanges = await wikiApiRecentChanges(cookies, rccontinue);
			rccontinue = moreWikiChanges.continue
				? moreWikiChanges.continue.rccontinue
				: null;
			changes = changes.concat(moreWikiChanges.query.recentchanges);
			changes = removeChangesDuplicates();
		}

		const wikiExtracts = await wikiApiExtract(
			cookies,
			changes.map((x) => x.pageid),
		);

		wikiData = changes.map((c) =>
			Object.assign(c, wikiExtracts.query.pages[c.pageid]),
		);
	}

	return wikiData.slice(0, 3);
}

// helper functions

async function wikiLoginToken() {
	const params = new URLSearchParams({
		action: "query",
		meta: "tokens",
		type: "login",
		format: "json",
	});

	try {
		const res = await fetch(
			`${PUBLIC_MEDIAWIKI_ENDPOINT}?${params.toString()}`,
			{
				method: "GET",
				credentials: "include",
			},
		);

		const data = await res.json();

		const loginToken = data?.query?.tokens?.logintoken;

		if (!loginToken) {
			throw new Error("Login token not found");
		}
		return { loginToken, cookies: res.headers.get("set-cookie") ?? "" };
	} catch (e) {
		console.log("Wiki login error");
		console.log(e);
		return null;
	}
}

async function wikiLoginSession(
	wikiLgUsername: string,
	wikiLgPassword: string,
	loginToken: string,
	cookies: string,
): Promise<{
	data: {
		login:
			| { result: "Success"; lguserid: number; lgusername: string }
			| { result: "Failed"; reason: string };
	};
	cookies: string;
}> {
	if (!wikiLgUsername) {
		return {
			data: { login: { result: "Failed", reason: "username not set" } },
			cookies: "",
		};
	}
	if (!wikiLgPassword) {
		return {
			data: { login: { result: "Failed", reason: "password not set" } },
			cookies: "",
		};
	}

	const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Cookie: cookies || "",
		},
		body: new URLSearchParams({
			action: "login",
			lgname: wikiLgUsername,
			lgpassword: wikiLgPassword,
			lgtoken: loginToken,
			format: "json",
		}),
		credentials: "include",
	});
	return {
		data: await res.json(),
		cookies: res.headers.get("set-cookie") ?? "",
	};
}

async function wikiApiRecentChanges(
	cookies: string,
	rccontinue: string | undefined = undefined,
): Promise<{
	batchcomplete: string;
	continue: { rccontinue: string; continue: string };
	query: {
		recentchanges: WikiChangeItem[];
	};
}> {
	const body = new URLSearchParams(
		Object.assign(
			{
				action: "query",
				list: "recentchanges",
				rcprop: "title|ids|comment|parsedcomment|flags|user|timestamp",
				rcnamespace: "0",
				rclimit: "3",
				format: "json",
			},
			rccontinue && { rccontinue },
		),
	);

	const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Cookie: cookies || "",
		},
		body,
		credentials: "include",
	});
	return await res.json();
}

async function wikiApiExtract(
	cookies: string,
	pageIDs: number[],
): Promise<{ query: { pages: Record<string, WikiExtractItem> } }> {
	const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Cookie: cookies || "",
		},
		body: new URLSearchParams({
			action: "query",
			prop: "extracts",
			exlimit: "max",
			exintro: "true",
			exchars: "100",
			pageids: pageIDs.join("|"),
			explaintext: "true",
			format: "json",
		}),
		credentials: "include",
	});
	return await res.json();
}

export const wikiDataCache = withCache(getWikiData, CACHE_INTERVAL);
