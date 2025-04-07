<script lang="ts">
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import dayjs from "dayjs";
  import type { ExpandedExpense } from "./+page.server";

  export let expenses: ExpandedExpense[];
  export let selectedExpense: ExpandedExpense | undefined;

  export let hide: Partial<Record<"from" | "signer" | "signed", boolean>> = {};

  function uniqueSigners(expense: ExpandedExpense) {
    // get unique signers based on signer.id
    const signerMap = expense.items.reduce((map, item) => {
      const member = item.signer;
      if (!map.has(member.id)) {
        map.set(member.id, member);
      }
      return map;
    }, new Map<string, ExpandedExpense["items"][number]["signer"]>());

    return Array.from(signerMap.values());
  }
</script>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th>Date</th>
        <th>Kostnadsställe(n)</th>
        <th>Description</th>
        {#if !hide.from}
          <th>Från</th>
        {/if}
        {#if !hide.signer}
          <th>Assigned to</th>
        {/if}
        {#if !hide.signed}
          <th>Signerad</th>
        {/if}
        <th>Privat</th>
        <th>Totalbelopp</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each expenses as expense (expense.id)}
        <!-- row 1 -->
        <tr
          class="cursor-pointer rounded-box"
          class:hover={selectedExpense !== expense}
          class:bg-base-content={selectedExpense === expense}
          class:text-base-100={selectedExpense === expense}
          on:click={() => {
            if (selectedExpense === expense) selectedExpense = undefined;
            else selectedExpense = expense;
          }}
        >
          <td>{dayjs(expense.date).format("DD/MM/YYYY")}</td>
          <td>
            {[...new Set(expense.items.map((item) => item.costCenter))].join(
              ", ",
            )}
          </td>
          <td class="max-w-48 overflow-hidden text-ellipsis whitespace-nowrap"
            >{expense.description}</td
          >
          {#if !hide.from}
            <td class="flex items-center gap-2">
              <MemberAvatar class="w-6 rounded-sm" member={expense.member} />
              <span
                class="max-w-24 overflow-hidden text-ellipsis whitespace-nowrap"
                >{getFullName(expense.member)}</span
              >
            </td>
          {/if}
          {#if !hide.signer}
            <td>
              {#each uniqueSigners(expense) as signer (signer.id)}
                <div class="flex items-center gap-2">
                  <MemberAvatar class="w-6 rounded-sm" member={signer} />
                  <span
                    class="max-w-24 overflow-hidden text-ellipsis whitespace-nowrap"
                    >{getFullName(signer)}
                  </span>
                </div>
              {/each}
            </td>
          {/if}
          {#if !hide.signed}
            <td>
              {#if expense.items.every((item) => item.signedAt !== null)}
                <span class="badge badge-success badge-sm">
                  <span class="i-mdi-close-check"></span>
                </span>
              {:else if expense.items.some((item) => item.signedAt !== null)}
                <span class="badge badge-warning badge-sm">
                  <span class="i-mdi-dots-horizontal text-lg"></span>
                </span>
              {:else}
                <span class="badge badge-error badge-sm">
                  <span class="i-mdi-close-bold"></span>
                </span>
              {/if}
            </td>
          {/if}
          <td>
            {#if !expense.isGuildCard}
              <span class="badge badge-success badge-sm">
                <span class="i-mdi-check-bold"></span>
              </span>
            {:else}
              <span class="badge badge-error badge-sm">
                <span class="i-mdi-close-bold"></span>
              </span>
            {/if}
          </td>
          <td>
            {expense.items
              .reduce((acc, item) => acc + item.amount / 100, 0)
              .toLocaleString()} kr
          </td>
          <td>
            <a href="/expenses/{expense.id}" class="btn btn-xs" target="_blank">
              <!-- open -->
              <span class="i-mdi-open-in-new"></span>
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
