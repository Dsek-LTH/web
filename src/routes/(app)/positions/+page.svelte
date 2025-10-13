<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import type { Position, Prisma } from "@prisma/client";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageData } from "./$types";
  import UpdatePositionAttributesForm from "./UpdatePositionAttributesForm.svelte";
  export let data: PageData;
  let positions = data.positions;
  let groupedByCommitte = positions.reduce<
    Record<
      string,
      Array<Prisma.PositionGetPayload<{ include: { committee: true } }>>
    >
  >((acc: any, position: Position) => {
    let committee = position.committeeId ?? "other";
    if (!acc[committee]) acc[committee] = [];
    acc[committee].push(position);
    return acc;
  }, {});
</script>

<SetPageTitle title={m.positions()} />
<PageHeader title={m.positions()} />

{#each Object.keys(groupedByCommitte) as comId}
  {@const positions = groupedByCommitte[comId] ?? []}
  <div>
    <h2 class="mt-2 text-xl font-bold">
      {positions[0]?.committee?.name ?? comId}
    </h2>
    {#each positions.toSorted((a, b) => {
      if (a.boardMember != b.boardMember) return a.boardMember ? -1 : 1;
      return a.name.localeCompare(b.name);
    }) as position}
      {#await data.updateForms[position.id] then form}
        <div class="flex gap-2 p-1 odd:bg-neutral">
          <a
            class="flex-1 text-primary underline"
            href="/positions/{position.id}">{position.name}</a
          >
          {#if isAuthorized(apiNames.POSITION.UPDATE, data.user)}
            <UpdatePositionAttributesForm {position} data={form!} />
          {/if}
        </div>
      {/await}
    {/each}
  </div>
{/each}
