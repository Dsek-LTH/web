<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import LocaleData from "dayjs/plugin/localeData";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import { Save, X } from "@lucide/svelte";
  import { Input } from "$lib/components/ui/input";
  import { enhance } from "$app/forms";
  import { toast } from "$lib/stores/toast";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { PageData } from "./$types";

  let { openingHours }: { openingHours: PageData["openingHours"] } = $props();

  let isEditing = $state(false);

  dayjs.extend(LocaleData);

  const toastResult: SubmitFunction =
    () =>
    async ({ result, update }) => {
      if (result.type === "success" || result.type === "failure") {
        const message = result.data?.["message"];
        if (typeof message === "string" && message) {
          toast(message, result.type === "success" ? "success" : "error");
        }
      }
      await update({ reset: false });
    };
</script>

<Card.Root class="h-fit">
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
            ? 'bg-rosa-50 dark:bg-rosa-900 border-rosa-500 border-[1px]'
            : ''}"
        >
          <p class="capitalize">{weekday}</p>
          {#if isEditing}
            <form
              class="flex gap-4"
              method="POST"
              action="?/updateHours"
              use:enhance={toastResult}
            >
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
