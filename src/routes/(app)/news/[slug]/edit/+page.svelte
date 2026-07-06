<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { superForm } from "$lib/utils/client/superForms";
  import { Label } from "$lib/components/ui/label";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import Pen from "@lucide/svelte/icons/pen";
  import * as m from "$paraglide/messages";
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

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    delayMs: 500,
  });

  let { form } = superform;

  const tz = getLocalTimeZone();

  let publishDate = $state<string | undefined>(
    $form.publishTime
      ? toCalendarDate(fromDate($form.publishTime, tz)).toString()
      : undefined,
  );
  let publishTimeValue = $state<Time>(
    $form.publishTime
      ? toTime(fromDate($form.publishTime, tz))
      : parseTime("12:00"),
  );

  let schedulePublish = $state<boolean>(!!$form.publishTime);

  $effect(() => {
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
  });
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  {superform}
  committees={data.committees}
>
  {#snippet formEnd()}
    <div class="flex w-full flex-col gap-1.5">
      <div class="flex flex-row items-center gap-2">
        <Checkbox
          bind:checked={schedulePublish}
          id="schedulePublish"
          class="p-2"
          onCheckedChange={(checked) => {
            if (!checked) publishDate = undefined;
          }}
        />
        <Label for="schedulePublish">{m.news_schedule_publish_time()}</Label>
      </div>
      {#if schedulePublish}
        <div class="flex flex-row items-center gap-2">
          <DatePicker bind:value={publishDate} />
          <TimePicker bind:value={publishTimeValue} />
        </div>
      {/if}
    </div>
    <div class="flex w-full flex-col gap-1.5">
      <Label for="sendNotification">{m.news_notification_send()}</Label
      ><Checkbox
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
  {/snippet}
</ArticleEditor>
