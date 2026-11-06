<script lang="ts">
  import { untrack } from "svelte";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Select from "$lib/components/ui/select";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Spinner } from "$lib/components/ui/spinner";

  import Editor from "$lib/components/Editor.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TimePicker from "$lib/components/datetime-selector/TimePicker.svelte";
  import ArticleImages from "./ArticleImages.svelte";

  import * as m from "$paraglide/messages";
  import { getLocale } from "$paraglide/runtime";

  import Pen from "@lucide/svelte/icons/pen";
  import User from "@lucide/svelte/icons/user";
  import Users from "@lucide/svelte/icons/users";
  import Play from "@lucide/svelte/icons/play";
  import Check from "@lucide/svelte/icons/check";
  import Info from "@lucide/svelte/icons/info";

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
  import {
    getStickyBottomOffset,
    stickyBottomClass,
  } from "$lib/bookings/stickyBottom";

  let {
    allTags,
    superform,
    activeTab = $bindable(),
    authorOptions,
    committees,
    action,
    isEditing = false,
    imageFileUrls = [],
    cancelHref = "/news",
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    activeTab: "sv" | "en";
    superform: SuperForm<ArticleSchema>;
    authorOptions: AuthorOption[];
    committees: Array<Pick<ExtendedPrismaModel<"Committee">, "id" | "name">>;
    action?: string;
    isEditing?: boolean;
    /** Object URLs for `$form.images`, in the same order. */
    imageFileUrls?: string[];
    cancelHref?: string;
  } = $props();

  const { form, errors, allErrors, enhance, delayed, submitting } =
    $derived(superform);

  const stickyBottom = $derived(getStickyBottomOffset());

  // ---- Language -------------------------------------------------------------

  const languages = [
    { value: "sv", label: m.language_swedish },
    { value: "en", label: m.language_english },
  ] as const;

  const written = $derived({
    sv: !!$form.headerSv?.trim() || !!$form.bodySv?.trim(),
    en: !!$form.headerEn?.trim() || !!$form.bodyEn?.trim(),
  });

  // After a submit, jump to the language that has errors; otherwise an error on the
  // hidden tab (e.g. the required Swedish header) would be invisible.
  $effect(() => {
    const current = $errors;
    untrack(() => {
      const svErrors = !!(current.headerSv || current.bodySv);
      const enErrors = !!(current.headerEn || current.bodyEn);
      if (svErrors && activeTab !== "sv") activeTab = "sv";
      else if (!svErrors && enErrors && activeTab !== "en") activeTab = "en";
    });
  });

  // ---- Details --------------------------------------------------------------

  const sameAuthorOption = (
    a: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
    b: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
  ) =>
    a.memberId === b.memberId &&
    a.mandateId === b.mandateId &&
    a.customId === b.customId &&
    a.type === b.type;

  // Sorted copy: sorting the prop in the template would mutate the caller's array.
  const sortedCommittees = $derived(
    [...committees].sort((a, b) => a.name.localeCompare(b.name)),
  );
  // bits-ui Select can't hold an empty value, so "no committee" uses a sentinel.
  const NO_COMMITTEE = "none";

  // ---- Images ---------------------------------------------------------------

  const existingImageUrls = $derived($form.imageUrls ?? []);
  const allImageUrls = $derived([...existingImageUrls, ...imageFileUrls]);
  // With no explicit choice, editing keeps the current cover and creating uses the first image.
  const coverIndex = $derived(
    $form.coverImageIndex ??
      (isEditing
        ? existingImageUrls.indexOf($form.imageUrl ?? "")
        : allImageUrls.length > 0
          ? 0
          : -1),
  );

  const sameFile = (a: File, b: File) =>
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

  function addImages(files: File[]) {
    const current = $form.images ?? [];
    $form.images = [
      ...current,
      ...files.filter((file) => !current.some((f) => sameFile(f, file))),
    ];
  }

  function removeImage(index: number) {
    const cover = coverIndex;
    const existingCount = existingImageUrls.length;
    if (index < existingCount) {
      $form.imageUrls = existingImageUrls.filter((_, i) => i !== index);
    } else {
      $form.images = $form.images.filter((_, i) => i !== index - existingCount);
    }

    // Keep the cover pointing at the same image, or move it to the first one.
    if (allImageUrls.length - 1 === 0) {
      $form.coverImageIndex = null;
      $form.imageUrl = null;
    } else if (cover === index) $form.coverImageIndex = 0;
    else if (cover > index) $form.coverImageIndex = cover - 1;
    else if (cover >= 0) $form.coverImageIndex = cover;
  }

  const imagesError = $derived(
    $allErrors.find((error) => error.path.startsWith("images"))?.messages[0],
  );

  // ---- Publishing -----------------------------------------------------------

  const tz = getLocalTimeZone();
  // Read once: these seed local state and must not track later form changes.
  const initialPublishTime = untrack(() => $form.publishTime);
  // A published article keeps its date; only drafts and scheduled articles can be (re)scheduled.
  const alreadyPublished = untrack(
    () => isEditing && !!initialPublishTime && initialPublishTime <= new Date(),
  );

  // These are immutable objects that are only re-assigned, so $state.raw avoids overhead.
  let publishDate = $state.raw<string | undefined>(
    initialPublishTime
      ? toCalendarDate(fromDate(initialPublishTime, tz)).toString()
      : undefined,
  );
  let publishTimeValue = $state.raw<Time>(
    initialPublishTime
      ? toTime(fromDate(initialPublishTime, tz))
      : parseTime("12:00"),
  );
  let publishMode = $state<"now" | "schedule">(
    initialPublishTime && !alreadyPublished ? "schedule" : "now",
  );

  function updatePublishTime() {
    if (publishMode === "schedule" && publishDate) {
      const parsed = parseDate(publishDate);
      $form.publishTime = new CalendarDateTime(
        parsed.year,
        parsed.month,
        parsed.day,
        publishTimeValue.hour,
        publishTimeValue.minute,
      ).toDate(tz);
    } else {
      $form.publishTime = null;
    }
  }

  const formatDateTime = (date: Date) =>
    date.toLocaleString(getLocale(), {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const scheduleInPast = $derived(
    publishMode === "schedule" &&
      !!$form.publishTime &&
      $form.publishTime <= new Date(),
  );
  // Scheduling without a date would silently publish right away, so it blocks submit instead.
  const scheduleIncomplete = $derived(
    !alreadyPublished &&
      publishMode === "schedule" &&
      (!$form.publishTime || scheduleInPast),
  );

  const submitLabel = $derived.by(() => {
    if (isEditing) return m.news_submit_save();
    if (publishMode === "schedule" && $form.publishTime)
      return m.news_submit_schedule({
        date: formatDateTime($form.publishTime),
      });
    return m.news_submit_publish();
  });

  // ---- Error summary --------------------------------------------------------

  const fieldLabel = (path: string): string => {
    if (path === "headerSv")
      return `${m.news_header()} (${m.language_swedish()})`;
    if (path === "headerEn")
      return `${m.news_header()} (${m.language_english()})`;
    if (path === "bodySv") return `${m.news_body()} (${m.language_swedish()})`;
    if (path === "bodyEn") return `${m.news_body()} (${m.language_english()})`;
    if (path.startsWith("tags")) return m.news_tags();
    if (path.startsWith("images")) return m.news_images();
    if (path === "youtubeUrl") return m.news_youtube_url();
    if (path.startsWith("author")) return m.news_author();
    if (path === "committeeId") return m.news_committee();
    if (path === "notificationText") return m.news_notification_text();
    return path;
  };
</script>

{#snippet sectionHeading(title: string)}
  <h2 class="text-lg font-semibold">{title}</h2>
{/snippet}

<form
  method="POST"
  {action}
  class="flex w-full min-w-0 flex-col gap-8"
  enctype="multipart/form-data"
  use:enhance
>
  <!-- Content -->
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      {@render sectionHeading(m.news_section_content())}
      <!-- Language of the header and text being edited. The check marks which
           versions have been written. Deselecting is ignored, so one is always active. -->
      <ToggleGroup.Root
        type="single"
        variant="outline"
        size="sm"
        aria-label={m.news_language()}
        bind:value={
          () => activeTab,
          (value) => {
            if (value === "sv" || value === "en") activeTab = value;
          }
        }
      >
        {#each languages as language (language.value)}
          <ToggleGroup.Item
            value={language.value}
            class="text-muted-foreground data-[state=on]:text-foreground gap-1.5 px-3"
          >
            {language.label()}
            {#if written[language.value]}
              <Check class="size-3.5" aria-hidden="true" />
              <span class="sr-only">({m.news_language_written()})</span>
            {/if}
          </ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
    </div>

    {#if activeTab === "en" && !written.en}
      <p class="text-muted-foreground flex items-start gap-2 text-sm">
        <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {m.news_language_fallback()}
      </p>
    {/if}

    <div class="flex flex-col gap-1.5">
      <Label for={activeTab === "sv" ? "headerSv" : "headerEn"}
        >{m.news_header()}</Label
      >
      {#if activeTab === "sv"}
        <Input
          bind:value={$form.headerSv}
          type="text"
          id="headerSv"
          name="headerSv"
          aria-invalid={!!$errors.headerSv}
          aria-errormessage={$errors.headerSv?.at(0)}
          placeholder={m.news_header()}><Pen /></Input
        >
      {:else}
        <Input
          bind:value={$form.headerEn}
          type="text"
          id="headerEn"
          name="headerEn"
          aria-invalid={!!$errors.headerEn}
          aria-errormessage={$errors.headerEn?.at(0)}
          placeholder={$form.headerSv || m.news_header()}><Pen /></Input
        >
      {/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for={activeTab === "sv" ? "bodySv" : "bodyEn"}
        >{m.news_body()}</Label
      >
      {#if activeTab === "sv"}
        <Editor
          id="bodySv"
          aria-invalid={!!$errors.bodySv}
          aria-errormessage={$errors.bodySv?.at(0)}
          name="bodySv"
          bind:value={$form.bodySv}
        />
      {:else}
        <Editor
          id="bodyEn"
          aria-invalid={!!$errors.bodyEn}
          aria-errormessage={$errors.bodyEn?.at(0)}
          name="bodyEn"
          bind:value={$form.bodyEn as string | undefined}
        />
      {/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="images">{m.news_images()}</Label>
      <p class="text-muted-foreground text-sm">{m.news_images_hint()}</p>
      <ArticleImages
        imageUrls={allImageUrls}
        {coverIndex}
        onadd={addImages}
        onremove={removeImage}
        oncover={(index) => ($form.coverImageIndex = index)}
        error={imagesError}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="youtubeUrl">{m.news_youtube_url()}</Label>
      <Input
        bind:value={$form.youtubeUrl}
        type="url"
        id="youtubeUrl"
        name="youtubeUrl"
        placeholder="https://youtube.com/watch?v=..."
        aria-invalid={!!$errors.youtubeUrl}
        aria-errormessage={$errors.youtubeUrl?.at(0)}><Play /></Input
      >
    </div>
  </section>

  <!-- Details -->
  <section class="flex flex-col gap-4 border-t pt-6">
    {@render sectionHeading(m.news_section_details())}

    <div class="flex flex-col gap-1.5">
      <Label for="author">{m.news_author()}</Label>
      <Select.Root type="single" bind:value={$form.author as unknown as string}>
        <Select.Trigger id="author" class="w-full"
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

    <div class="flex flex-col gap-1.5">
      <Label for="committee">{m.news_committee()}</Label>
      <Select.Root
        type="single"
        bind:value={
          () => $form.committeeId ?? NO_COMMITTEE,
          (value) => {
            $form.committeeId = value && value !== NO_COMMITTEE ? value : null;
          }
        }
      >
        <Select.Trigger id="committee" class="w-full"
          ><Users />{committees.find((c) => c.id === $form.committeeId)?.name ??
            m.news_noCommittee()}</Select.Trigger
        >
        <Select.Content side="bottom">
          <Select.Item value={NO_COMMITTEE}>{m.news_noCommittee()}</Select.Item>
          {#each sortedCommittees as committee (committee.id)}
            <Select.Item value={committee.id}>{committee.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="tags">{m.news_tags()}</Label>
      <TagSelector
        aria-invalid={!!$errors.tags}
        aria-errormessage={$errors.tags?._errors?.at(0)}
        name="tags"
        bind:selectedTags={$form.tags}
        {allTags}
      />
    </div>
  </section>

  <!-- Publishing -->
  <section class="flex flex-col gap-4 border-t pt-6">
    {@render sectionHeading(m.news_section_publishing())}

    {#if alreadyPublished && initialPublishTime}
      <p class="text-muted-foreground text-sm">
        {m.news_published({ date: formatDateTime(initialPublishTime) })}
      </p>
    {:else}
      <RadioGroup.Root
        bind:value={
          () => publishMode,
          (value) => {
            publishMode = value === "schedule" ? "schedule" : "now";
            updatePublishTime();
          }
        }
        class="gap-3"
      >
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="now" id="publish-now" />
          <Label for="publish-now">{m.news_publish_now()}</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="schedule" id="publish-schedule" />
          <Label for="publish-schedule">{m.news_publish_schedule()}</Label>
        </div>
      </RadioGroup.Root>
      {#if publishMode === "schedule"}
        <div class="flex flex-col gap-1.5 pl-6">
          <div class="flex flex-wrap items-center gap-2">
            <DatePicker
              error={scheduleInPast}
              bind:value={
                () => publishDate,
                (value) => {
                  publishDate = value;
                  updatePublishTime();
                }
              }
            />
            <TimePicker
              bind:value={
                () => publishTimeValue,
                (value) => {
                  publishTimeValue = value;
                  updatePublishTime();
                }
              }
            />
          </div>
          {#if scheduleInPast}
            <p class="text-destructive text-xs font-semibold">
              {m.news_schedule_pastError()}
            </p>
          {/if}
        </div>
      {/if}
    {/if}

    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <Checkbox
          bind:checked={$form.sendNotification}
          id="sendNotification"
          name="sendNotification"
        />
        <Label for="sendNotification">{m.news_notification_toggle()}</Label>
      </div>
      {#if $form.sendNotification}
        <div class="flex flex-col gap-1.5 pl-6">
          {#if $form.tags.length === 0}
            <p class="text-muted-foreground flex items-start gap-2 text-sm">
              <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {m.news_notification_tagsHint()}
            </p>
          {/if}
          <Label for="notificationText">{m.news_notification_text()}</Label>
          <Input
            bind:value={$form.notificationText}
            type="text"
            id="notificationText"
            name="notificationText"
            placeholder={m.news_notification_placeholder()}><Pen /></Input
          >
          <span class="text-muted-foreground text-xs"
            >{m.news_notification_explanation()}</span
          >
        </div>
      {/if}
    </div>
  </section>

  <!-- Sticky so the actions stay in reach on a long form; lifted above the mobile nav. -->
  <div
    class="{stickyBottomClass} bg-background sticky z-10 -mx-4 flex flex-col gap-3 border-t px-4 py-3"
    style:bottom={stickyBottom}
  >
    {#if $allErrors.length > 0}
      <div
        role="alert"
        class="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
      >
        <p class="font-semibold">{m.news_errors_summary()}</p>
        <ul class="mt-1 ml-4 list-disc">
          {#each $allErrors as error (error.path)}
            <li>{fieldLabel(error.path)}: {error.messages.join(" ")}</li>
          {/each}
        </ul>
      </div>
    {/if}
    <div class="flex gap-2">
      <Button href={cancelHref} variant="outline">{m.cancel()}</Button>
      <Button
        type="submit"
        class="flex-1"
        disabled={$submitting || scheduleIncomplete}
      >
        {submitLabel}
        {#if $delayed}<Spinner />{/if}
      </Button>
    </div>
  </div>
</form>
