<script lang="ts">
import { m } from "$paraglide/messages";

const { data } = $props();
</script>

<div>
      <h3>{m.openElections()}</h3>
      <div class="mt-2 grid grid-cols-2 gap-4 sm:flex sm:flex-row">
        {#each data.elections as election, i (election.id)}
          <Card.Root
            class={[
              "flex flex-col items-center gap-0 p-4 sm:w-1/3 lg:w-50",
              i >= 2 && "hidden sm:flex",
            ]}
          >
            <CommitteeIcon committee={election.committee} class="size-24" />
            <h5 class="w-full truncate py-2 text-center">
              {election.committee.name}
            </h5>
            <span class="w-full text-center font-light">
              {m.elections_close()}
              {dayjs(election.expiresAt)
                .tz(dayjs.tz.guess())
                .format("YYYY-MM-DD")}</span
            >
            <Button href={election.link} class="mt-4"
              >{m.elections_apply()}</Button
            >
          </Card.Root>
        {:else}
          <div
            class="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground"
          >
            <span class="font-medium">{m.home_electionsEmpty()}</span>
          </div>
        {/each}
      </div>
    </div>
