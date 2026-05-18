<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import { Spinner } from "$lib/components/ui/spinner";
  import ElectionCard from "./ElectionCard.svelte";
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import type { PageData as CreatePageData } from "./create/$types";
  import type { PageData as EditPageData } from "./[id]/edit/$types";

  dayjs.extend(utc);
  dayjs.extend(timezone);

  let {
    data,
    isCreating,
  }: {
    data: CreatePageData | EditPageData;
    isCreating: boolean;
  } = $props();

  const { form, errors, constraints, enhance, delayed } = $derived(
    superForm(data.form),
  );

  const selectedCommittee = $derived(
    data.committees.find((c) => c.id === $form.committeeId),
  );
</script>

<div class="layout-container">
  <h2>
    {isCreating ? m.elections_create() : m.elections_edit()}
  </h2>

  <div class="mt-2 flex flex-row gap-8">
    <form
      id="election-editor"
      method="POST"
      action={isCreating ? "?/create" : "?/update"}
      use:enhance
      class="flex w-7/12 flex-col gap-3"
    >
      <div class="flex flex-col gap-1.5">
        <Label for="committee">{m.elections_committee()}</Label>

        <Select.Root
          type="single"
          name="committeeId"
          bind:value={$form.committeeId}
          {...$constraints.committeeId}
        >
          <Select.Trigger class="w-full">
            {selectedCommittee?.name ?? m.elections_committee()}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              {#each data.committees as committeeOption (committeeOption.id)}
                <Select.Item value={committeeOption.id}>
                  {committeeOption.name}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      {#if $errors.committeeId}
        <p class="text-destructive-foreground">{$errors.committeeId}</p>
      {/if}
      <div class="flex flex-col gap-0 *:w-full md:h-64 md:flex-row md:gap-8">
        <div class="flex flex-col gap-1.5">
          <Label>{m.elections_content_sv()}</Label>
          <Textarea
            name="markdownSv"
            bind:value={$form.markdownSv}
            aria-invalid={!!$errors.markdownSv}
            aria-errormessage={$errors.markdownSv?.at(0)}
            class="h-full"
            placeholder="- Post 1&#13;- Post 2&#13;- Post 3"
            {...$constraints.markdownSv}
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{m.elections_content_en()}</Label>
          <Textarea
            name="markdownEn"
            bind:value={$form.markdownEn}
            aria-invalid={!!$errors.markdownEn}
            aria-errormessage={$errors.markdownEn?.at(0)}
            class="h-full"
            placeholder="- Position 1&#13;- Position 2&#13;- Position 3"
            {...$constraints.markdownEn}
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{m.elections_link()}</Label>
        <Input
          name="link"
          bind:value={$form.link}
          aria-invalid={!!$errors.link}
          aria-errormessage={$errors.link?.at(0)}
          class="h-full"
          placeholder={m.elections_link_placeholder()}
          {...$constraints.link}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>{m.elections_expiryDate()}</Label>
        <DatePicker
          class="w-full"
          name="expiresAt"
          bind:value={$form.expiresAt}
          error={!!$errors.expiresAt}
        />
      </div>

      <div class="flex w-full flex-row justify-between gap-1.5">
        <Button onclick={() => history.back()} variant="outline"
          >{m.cancel()}</Button
        >
        <Button type="submit" class="block grow"
          >{m.elections_save()}{#if $delayed}<Spinner />{/if}</Button
        >
      </div>
    </form>
    <div class="w-[300px]">
      <h3 class="my-4">{m.elections_preview()}</h3>
      <ElectionCard
        election={{
          markdown: $form.markdownSv || "",
          markdownSv: $form.markdownSv || "",
          markdownEn: $form.markdownEn || "",
          expiresAt: dayjs($form.expiresAt).tz(dayjs.tz.guess()).toDate(),
          committeeId: $form.committeeId,
          link: $form.link,
          committee: selectedCommittee,
          id: "",
          createdAt: new Date(),
        }}
      />
    </div>
  </div>
</div>
