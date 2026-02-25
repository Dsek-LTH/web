import type { MockTickets } from "$lib/server/shop/mock";

declare module "vitest" {
	export interface TestContext {
		tickets: MockTickets;
	}
}
