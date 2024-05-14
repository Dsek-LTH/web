<script lang="ts">
  import type { PageData } from "./$types";
  import {
    NotificationSettingType,
    NotificationSettingTypeDescription,
  } from "$lib/utils/notifications/types";
  import SubscriptionTags from "./SubscriptionTags.svelte";
  import type { Tag } from "@prisma/client";

  export let data: PageData;
  $: subscribedTags = data.subscribedTags as { subscribedTags: Tag[] };
  $: tags = data.tags;

  let subscriptionGroup = data.subscriptions;
  let pushGroup = data.pushSubscriptions;

  const convertToKey = (text: string) => {
    return text as keyof typeof NotificationSettingTypeDescription;
  };
</script>

<svelte:head>
  <title>Inställningar | D-sektionen</title>
</svelte:head>

<h1 class="mt-2 text-center text-3xl font-bold">Inställningar</h1>
<div class="relative">
  <form
    method="POST"
    class="mt-2 flex w-full flex-col items-center justify-start pb-24 lg:flex-row lg:items-start lg:justify-center"
  >
    <div class="m-2 flex w-full max-w-2xl flex-col items-center lg:p-0">
      <h2 class="mb-2 text-2xl font-bold">Notifikationer</h2>
      {#each Object.entries(NotificationSettingType) as notificationSettingType}
        <div class="m-2 w-full">
          <!-- Web notification -->
          <label class="m-2 flex cursor-pointer flex-row justify-between">
            <span
              class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              {NotificationSettingTypeDescription[
                convertToKey(notificationSettingType[0])
              ]}</span
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
              >Pushnotis</span
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
      <h2 class="mb-2 text-2xl font-bold">Nyhetsprenumerationer</h2>
      <SubscriptionTags {tags} subscribedTags={subscribedTags.subscribedTags} />
    </div>
    <button
      class="btn absolute bottom-0 mb-4 mt-4 w-full max-w-xl bg-primary"
      type="submit">Tillämpa</button
    >
  </form>
</div>
