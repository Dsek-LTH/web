<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as Select from "$lib/components/ui/select";

  import FileUpload from "$lib/components/FileUpload.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";

  import * as m from "$paraglide/messages";

  import Pen from "@lucide/svelte/icons/pen";
  import User from "@lucide/svelte/icons/user";

  import { Checkbox } from "$lib/components/ui/checkbox";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TimePicker from "$lib/components/datetime-selector/TimePicker.svelte";
  import {
    CalendarDateTime,
    fromDate,
    getLocalTimeZone,
    parseDate,
    parseTime,
    toCalendarDate,
    toTime,
  } from "@internationalized/date";
  import type { Time } from "@internationalized/date";

  import { type SuperForm } from "sveltekit-superforms";

  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import type { ArticleSchema } from "$lib/news/schema";
  import type { AuthorOption } from "$lib/news/getArticles";
  import { Spinner } from "$lib/components/ui/spinner";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import Users from "@lucide/svelte/icons/users";

  let {
    allTags,
    superform,
    activeTab = $bindable(),
    authorOptions,
    committees,
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    activeTab: "sv" | "en";
    superform: SuperForm<ArticleSchema>;
    authorOptions: AuthorOption[];
    committees: Array<Pick<ExtendedPrismaModel<"Committee">, "id" | "name">>;
  } = $props();

  const { form, errors, enhance, delayed } = $derived(superform);

  const tz = getLocalTimeZone();

  // These are immutable objects that are only re-assigned,
  // so using $state.raw avoids overhead.
  let publishDate = $state.raw<string | undefined>(
    $form.publishTime
      ? toCalendarDate(fromDate($form.publishTime, tz)).toString()
      : undefined,
  );
  let publishTimeValue = $state.raw<Time>(
    $form.publishTime
      ? toTime(fromDate($form.publishTime, tz))
      : parseTime("12:00"),
  );

  let schedulePublish = $state<boolean>(!!$form.publishTime);

  function updatePublishTime() {
    if (schedulePublish && publishDate) {
      const parsed = parseDate(publishDate);
      const dt = new CalendarDateTime(
        parsed.year,
        parsed.month,
        parsed.day,
        publishTimeValue.hour,
        publishTimeValue.minute,
      );
      $form.publishTime = dt.toDate(tz);
    } else {
      $form.publishTime = null;
    }
  }

  const sameAuthorOption = (
    a: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
    b: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
  ) =>
    a.memberId === b.memberId &&
    a.mandateId === b.mandateId &&
    a.customId === b.customId &&
    a.type === b.type;

  let filelist: FileList | undefined = $state();

  $form.images.forEach((f) => {
    const dt = new DataTransfer();
    dt.items.add(f);
    filelist = dt.files;
  });
  function onFileUpload() {
    // @ts-expect-error -- expected
    $form.images = [...filelist];
  }
</script>

<form
  method="POST"
  class="form-control mb-8 flex w-full flex-col gap-4"
  enctype="multipart/form-data"
  use:enhance
>
  <div class="flex w-full flex-row">
    <div class="flex w-full flex-col gap-1.5">
      <Label for="header">{m.news_header()}</Label>
      <div class="flex flex-row gap-2">
        {#if activeTab == "sv"}<Input
            bind:value={$form.headerSv}
            type="text"
            id="headerSv"
            name="headerSv"
            aria-invalid={!!$errors.headerSv}
            aria-errormessage={$errors.headerSv?.at(0)}
            placeholder={m.news_header()}><Pen /></Input
          >{:else}
          <Input
            bind:value={$form.headerEn}
            type="text"
            id="headerEn"
            name="headerEn"
            aria-invalid={!!$errors.headerEn}
            aria-errormessage={$errors.headerEn?.at(0)}
            placeholder={m.news_header()}><Pen /></Input
          >
        {/if}
        <ButtonGroup.Root>
          <Button
            type="button"
            class={activeTab == "sv"
              ? "bg-neutral-100 dark:bg-neutral-900"
              : ""}
            onclick={() => (activeTab = "sv")}
            variant="outline">{m.language_swedish()}</Button
          >
          <Button
            type="button"
            class={activeTab == "en"
              ? "bg-neutral-100 dark:bg-neutral-900"
              : ""}
            onclick={() => (activeTab = "en")}
            variant="outline">{m.language_english()}</Button
          >
        </ButtonGroup.Root>
      </div>
    </div>
  </div>

  {#if activeTab == "sv"}
    <Editor
      aria-invalid={!!$errors.bodySv}
      aria-errormessage={$errors.bodySv?.at(0)}
      name="bodySv"
      bind:value={$form.bodySv}
    />
  {:else}
    <Editor
      aria-invalid={!!$errors.bodyEn}
      aria-errormessage={$errors.bodyEn?.at(0)}
      name="bodyEn"
      bind:value={$form.bodyEn as string | undefined}
    />
  {/if}

  <div class="flex w-full flex-col gap-1.5">
    <Label for="author">{m.news_author()}</Label>
    <Select.Root type="single" bind:value={$form.author as unknown as string}>
      <Select.Trigger class="w-full"
        ><User
        />{#if $form.author.type === "Custom" && $form.author.customAuthor != null}{$form
            .author.customAuthor.name}{:else}{$form.author.member.firstName}
          {$form.author.member
            .lastName}{#if $form.author.mandate?.position.name},
            {$form.author.mandate?.position.name}
          {/if}{/if}</Select.Trigger
      >
      <Select.Content>
        {#each authorOptions as authorOption (authorOption.id)}
          <Select.Item
            value={sameAuthorOption(authorOption, $form.author)
              ? ($form.author as unknown as string)
              : (authorOption as unknown as string)}
            >{#if authorOption.type === "Custom" && authorOption.customAuthor != null}
              {authorOption.customAuthor.name}
            {:else}
              {authorOption.member.firstName}
              {authorOption.member
                .lastName}{#if authorOption.mandate?.position.name},
                {authorOption.mandate?.position.name}
              {/if}
            {/if}</Select.Item
          >
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex w-full flex-col gap-1.5">
    <Label for="tags">{m.news_tags()}</Label>
    <TagSelector
      aria-invalid={!!$errors.tags}
      aria-errormessage={$errors.tags?._errors?.at(0)}
      name="tags"
      bind:selectedTags={$form.tags}
      {allTags}
    />
  </div>

  <div class="flex w-full flex-col gap-1.5">
    <Label for="committee">{m.news_committee()}</Label>
    <Select.Root
      type="single"
      bind:value={$form.committeeId as unknown as string}
      name="committeeId"
    >
      <Select.Trigger class="w-full"
        ><Users />{committees.find((_) => _.id == $form.committeeId)?.name ??
          ""}</Select.Trigger
      >
      <Select.Content side="bottom">
        {#each committees.sort( (c1, c2) => c1.name.localeCompare(c2.name), ) as committee (committee.id)}
          <Select.Item value={committee.id}>{committee.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <FileUpload
    multiple
    onchange={() => onFileUpload()}
    bind:files={() => filelist, (f) => (filelist = f)}
  />

  <div class="flex w-full flex-col gap-1.5">
    <div class="flex flex-row items-center gap-2">
      <Checkbox
        bind:checked={schedulePublish}
        id="schedulePublish"
        class="p-2"
        onCheckedChange={(checked) => {
          if (!checked) publishDate = undefined;
          updatePublishTime();
        }}
      />
      <Label for="schedulePublish">{m.news_schedule_publish_time()}</Label>
    </div>
    {#if schedulePublish}
      <div class="flex flex-row items-center gap-2">
        <DatePicker
          bind:value={() => publishDate,
          (value) => {
            publishDate = value;
            updatePublishTime();
          }}
        />
        <TimePicker
          bind:value={() => publishTimeValue,
          (value) => {
            publishTimeValue = value;
            updatePublishTime();
          }}
        />
      </div>
    {/if}
  </div>
  <div class="flex w-full flex-col gap-1.5">
    <Label for="sendNotification">{m.news_notification_send()}</Label><Checkbox
      bind:checked={$form.sendNotification}
      id="sendNotification"
      name="sendNotification"
      class="p-2"
    />
  </div>
  <div class="flex w-full flex-col gap-1.5">
    <Label for="notificationText">{m.news_notification_text()}</Label><Input
      bind:value={$form.notificationText}
      type="text"
      id="notificationText"
      name="notificationText"
      placeholder="Notistext"><Pen /></Input
    >
    <span class="text-xs">{m.news_notification_explanation()}</span>
  </div>

  <div class="flex w-full flex-col gap-1.5">
    <Label for="youtubeUrl">{m.news_youtube_url()}</Label><Input
      bind:value={$form.youtubeUrl}
      type="text"
      id="youtubeUrl"
      name="youtubeUrl"
      placeholder="https://youtube.com/v/..."><Pen /></Input
    >
  </div>
  <div class="flex w-full flex-row justify-between gap-1.5">
    <Button onclick={() => goto(resolve("/news"))} variant="outline"
      >{m.cancel()}</Button
    >
    <Button type="submit" class="block grow"
      >{m.news_publish()}{#if $delayed}<Spinner />{/if}</Button
    >
  </div>
</form>
