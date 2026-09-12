<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import LocaleData from "dayjs/plugin/localeData";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import { Save, X } from "@lucide/svelte";
  import { Input } from "$lib/components/ui/input";
  import { enhanceWithToast } from "$lib/stores/toast";
  import { updateHours } from "./times.remote";
  import type { PageData } from "./$types";

  let { openingHours }: { openingHours: PageData["openingHours"] } = $props();

  let isEditing = $state(false);

  dayjs.extend(LocaleData);
</script>

<Card.Root>
  <Card.Content>
    <h3 class="flex flex-row justify-between">
      {m.committees_cafe_openinghours()}
      <Button
        onclick={() => {
          isEditing = !isEditing;
        }}
        variant="outline"
        size="icon-sm"
        >{#if isEditing}<X />{:else}<Pen />{/if}</Button
      >
    </h3>
    <span class="text-muted-foreground">{m.committees_cafe_thecafe()}</span>
    <ol class="ml-0 list-none">
      {#each openingHours as openingHour, i (openingHour)}
        {@const weekday = dayjs.weekdays()[i + 1]}

        {@const isToday = dayjs().day() - 1 === i}
        <li
          class="odd:bg-background flex flex-row items-center justify-between gap-10 rounded-sm p-2 {isToday
            ? 'bg-rosa-50 border-rosa-500 border-[1px]'
            : ''}"
        >
          <p class="capitalize">{weekday}</p>
          {#if isEditing}
            <form class="flex gap-4" {...enhanceWithToast(updateHours.for(i))}>
              <input
                hidden
                type="text"
                name="markdownSlug"
                value={openingHour.name}
              />
              <Input
                type="text"
                class="w-30"
                name="markdownSv"
                value={openingHour.markdown}
              />
              <Button
                variant="outline"
                size="icon-sm"
                type="submit"
                aria-label="submit new cafe opening time"
              >
                <Save />
              </Button>
            </form>
          {:else}
            <span class="whitespace-nowrap">{openingHour.markdown}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </Card.Content>
</Card.Root>
