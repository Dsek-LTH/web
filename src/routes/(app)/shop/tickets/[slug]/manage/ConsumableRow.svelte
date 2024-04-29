<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Consumable, Member } from "@prisma/client";
  import dayjs from "dayjs";
  import RowAction from "./RowAction.svelte";

  export let stripeIntentBaseUrl: string;
  export let consumable: Consumable & {
    member: Member | null;
  };
  $: member = consumable.member;
</script>

<tr>
  <td>
    <div class="flex items-center gap-3">
      <MemberAvatar
        class="h-8 w-8"
        {member}
        identficationHash={consumable.externalCustomerCode}
      />
      <div>
        <div class="font-bold">
          {member ? getFullName(member) : "Icke inloggad"}
        </div>
        {#if consumable.externalCustomerEmail}
          <div class="text-sm opacity-50">
            {consumable.externalCustomerEmail}
          </div>
        {/if}
      </div>
    </div>
  </td>
  <td>
    {member ? member.foodPreference ?? "" : ""}
  </td>
  <td>
    {dayjs(consumable.purchasedAt).format("HH:MM:ss DD-MM-YYYY")}
  </td>
  <td>
    {#if consumable.consumedAt}
      <span class="text-green-500">
        {dayjs(consumable.consumedAt).format("HH:MM:ss DD-MM-YYYY")}
      </span>
    {:else}
      <span class="">Ej konsumerad</span>
    {/if}
  </td>
  <td>
    {#if consumable.priceAtPurchase}
      <Price price={consumable.priceAtPurchase} />
    {:else}
      <span>Okänt</span>
    {/if}
  </td>
  <td>
    {#if consumable.stripeIntentId}
      <a
        class="link text-primary"
        href="{stripeIntentBaseUrl}/{consumable.stripeIntentId}"
      >
        {consumable.stripeIntentId}
      </a>
    {:else}
      <span>Betalade ej</span>
    {/if}
  </td>
  <th>
    {#if consumable.consumedAt === null}
      <RowAction action="?/consume" consumableId={consumable.id}>
        <span class="i-mdi-flame-circle text-xl text-secondary" />
      </RowAction>
    {:else}
      <RowAction
        action="?/unconsume"
        consumableId={consumable.id}
        warningMessage="Är du säker på att du vill avkonsumera biljetten?"
      >
        <span class="i-mdi-redo-variant text-xl text-error" />
      </RowAction>
    {/if}
  </th>
  <th>
    <RowAction
      action="?/refund"
      consumableId={consumable.id}
      warningMessage="Är du säker på att du vill ge personen en återbetalning?"
    >
      <span class="i-mdi-cash-refund text-xl text-success" />
    </RowAction>
  </th>
</tr>
