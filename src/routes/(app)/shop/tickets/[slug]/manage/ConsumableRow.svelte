<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type {
    Consumable,
    ConsumableReservation,
    Member,
  } from "@prisma/client";
  import dayjs from "dayjs";
  import RowAction from "./RowAction.svelte";
  import { page } from "$app/stores";

  $: stripeIntentBaseUrl = $page.data["stripeIntentBaseUrl"]; // required to be return by the +page.server.ts where this is rendered.
  // one of the following has to be specified
  export let consumable:
    | (Consumable & {
        member: Member | null;
      })
    | null = null;
  export let reservation:
    | (ConsumableReservation & {
        member: Member | null;
      })
    | null = null;
  if (!consumable && !reservation)
    throw new Error("Either consumable or reservation must be specified");
  $: item = (consumable ?? reservation)!;
  $: member = item.member;
</script>

<tr>
  <td>
    <div class="flex items-center gap-3">
      <MemberAvatar
        class="h-8 w-8"
        {member}
        identficationHash={item.externalCustomerCode}
      />
      <div>
        <div class="font-bold">
          {member ? getFullName(member) : "Icke inloggad"}
        </div>
        {#if item.externalCustomerEmail}
          <div class="text-sm opacity-50">
            {item.externalCustomerEmail}
          </div>
        {/if}
      </div>
    </div>
  </td>
  <td>
    {member ? member.foodPreference ?? "" : ""}
  </td>
  <td>
    {#if consumable?.purchasedAt}
      {dayjs(consumable.purchasedAt).format("HH:MM:ss DD-MM-YYYY")}
    {:else}
      <span class="font-semibold text-gray-400">N/A</span>
    {/if}
  </td>
  <td>
    {#if consumable?.consumedAt}
      <span class="text-green-500">
        {dayjs(consumable.consumedAt).format("HH:MM:ss DD-MM-YYYY")}
      </span>
    {:else if consumable}
      <span class="">Ej konsumerad</span>
    {:else}
      <span class="font-semibold text-gray-400">N/A</span>
    {/if}
  </td>
  <td>
    {#if consumable?.priceAtPurchase}
      <Price price={consumable.priceAtPurchase} />
    {:else if consumable?.purchasedAt !== null}
      <span>Okänt</span>
    {:else}
      <span class="font-semibold text-gray-400">N/A</span>
    {/if}
  </td>
  <td>
    {#if consumable?.stripeIntentId}
      <a
        class="link text-primary"
        href="{stripeIntentBaseUrl}/{consumable.stripeIntentId}"
      >
        {consumable.stripeIntentId}
      </a>
    {:else if consumable?.purchasedAt}
      <span>Finns inte sparad</span>
    {:else}
      <span class="font-semibold text-gray-400">N/A</span>
    {/if}
  </td>
  <th>
    {#if consumable?.consumedAt === null}
      <RowAction action="?/consume" consumableId={consumable.id}>
        <span class="i-mdi-flame-circle text-xl text-secondary" />
      </RowAction>
    {:else if consumable}
      <RowAction
        action="?/unconsume"
        consumableId={consumable.id}
        warningMessage="Är du säker på att du vill avkonsumera biljetten?"
      >
        <span class="i-mdi-redo-variant text-xl text-error" />
      </RowAction>
    {:else}
      <span class="font-semibold text-gray-400">N/A</span>
    {/if}
  </th>
  <th>
    {#if consumable}
      <RowAction
        action="?/refund"
        consumableId={consumable.id}
        warningMessage="Är du säker på att du vill ge personen en återbetalning?"
      >
        <span class="i-mdi-cash-refund text-xl text-success" />
      </RowAction>
    {/if}
  </th>
</tr>
