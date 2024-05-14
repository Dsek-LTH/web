<script lang="ts">
  import type { PageData } from "./$types";
  import { NotificationSettingType } from "$lib/utils/notifications/types";
  import SubscriptionTags from "./SubscriptionTags.svelte";
  import type { Tag } from "@prisma/client";
  import * as m from "$paraglide/messages";

  export let data: PageData;
  $: subscribedTags = data.subscribedTags as { subscribedTags: Tag[] };
  $: tags = data.tags;

  let subscriptionGroup = data.subscriptions;
  let pushGroup = data.pushSubscriptions;

  const notificationText = {
    LIKE: m.setting_like,
    COMMENT: m.setting_comment,
    MENTION: m.setting_mention,
    NEW_ARTICLE: m.setting_new_article,
    EVENT_GOING: m.setting_event_going,
    CREATE_MANDATE: m.setting_create_mandate,
    BOOKING_REQUEST: m.setting_booking_request,
    PING: m.setting_ping,
  } as const;

  type NotificationText =
    | "LIKE"
    | "COMMENT"
    | "MENTION"
    | "NEW_ARTICLE"
    | "EVENT_GOING"
    | "CREATE_MANDATE"
    | "BOOKING_REQUEST"
    | "PING";
  const getNotificationText = (text: string) => {
    return notificationText[<NotificationText>text](); // Type cast string to string literal
  };
</script>

<svelte:head>
  <title>{m.setting_title()} | D-sektionen</title>
</svelte:head>

<h1 class="mt-2 text-center text-3xl font-bold">{m.setting_title()}</h1>
<div class="relative">
  <form
    method="POST"
    class="mt-2 flex w-full flex-col items-center justify-start pb-24 lg:flex-row lg:items-start lg:justify-center"
  >
    <div class="m-2 flex w-full max-w-2xl flex-col items-center lg:p-0">
      <h2 class="mb-2 text-2xl font-bold">{m.setting_notification()}</h2>
      {#each Object.entries(NotificationSettingType) as notificationSettingType}
        <div class="m-2 w-full">
          <!-- Web notification -->
          <label class="m-2 flex cursor-pointer flex-row justify-between">
            <span
              class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              {getNotificationText(notificationSettingType[0])}</span
            >
            <input
              type="checkbox"
              value={notificationSettingType[0]}
              name="subscription"
              bind:group={subscriptionGroup}
              class="peer sr-only"
            />
            <div
              class="peer relative h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"
            ></div>
          </label>

          <!-- Push notification -->
          <label
            class={!subscriptionGroup.find(
              (a) => a == notificationSettingType[0],
            )
              ? "hidden"
              : "m-2 flex cursor-pointer flex-row justify-between"}
          >
            <span
              class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
              >{m.setting_push()}</span
            >
            <input
              type="checkbox"
              value={notificationSettingType[0]}
              name="push"
              bind:group={pushGroup}
              class="peer sr-only"
            />
            <div
              class="peer relative h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-gray-800"
            ></div>
          </label>
        </div>
      {/each}
    </div>
    <div class="m-2 flex w-full max-w-2xl flex-col items-center lg:p-0">
      <h2 class="mb-2 text-2xl font-bold">{m.setting_subscription()}</h2>
      <SubscriptionTags {tags} subscribedTags={subscribedTags.subscribedTags} />
    </div>
    <button
      class="btn absolute bottom-0 mb-4 mt-4 w-full max-w-xl bg-primary"
      type="submit">{m.setting_apply()}</button
    >
  </form>
</div>
