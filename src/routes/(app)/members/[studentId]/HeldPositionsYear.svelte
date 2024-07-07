<script lang="ts">
  import CommitteeIcon from "$lib/components/CommitteeIcon.svelte";
  import type { MandateWithPositionAndCommitte } from "./types";
  import { languageTag } from "$paraglide/runtime";

  export let year: string;
  export let mandates: MandateWithPositionAndCommitte[];
</script>

<section class="mb-4">
  <h1 class="text-xl font-semibold">{year}</h1>
  <div class="flex flex-col items-stretch gap-0">
    {#each mandates as mandate (mandate.id)}
      {#if mandate.position}
        <div
          class="tooltip -mx-4 whitespace-pre"
          data-tip={mandate.position.committee?.name +
            `\n${mandate.startDate.toLocaleDateString(
              languageTag(),
            )} - ${mandate.endDate.toLocaleDateString(languageTag())}`}
        >
          <a href="/positions/{mandate.position.id}">
            <button
              class="btn btn-ghost w-full justify-start gap-2 normal-case text-primary"
            >
              {#if mandate.position.committee}
                <figure class="h-8 w-8 overflow-hidden">
                  <CommitteeIcon
                    imageUrl={mandate.position.committee.imageUrl}
                  />
                </figure>
              {/if}
              <span
                class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
              >
                {mandate.position.name}
              </span>
            </button>
          </a>
        </div>
      {/if}
    {/each}
  </div>
</section>
