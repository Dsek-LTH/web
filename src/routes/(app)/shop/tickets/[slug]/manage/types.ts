import type { load } from "./+page.server";

export type LoadData = Awaited<ReturnType<typeof load>>;
export type ConsumableRowData = LoadData["purchasedConsumables"][number];
export type ReservationData = LoadData["reservations"][number];
