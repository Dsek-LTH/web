<script lang="ts">
  import type { PageData } from "./$types";
  import { NotificationSettingType } from "$lib/utils/notifications/types";
  import NotificationSetting from "./NotificationSetting.svelte";
  import SubscriptionTags from "./SubscriptionTags.svelte";
  import type { Tag } from "@prisma/client";

  export let data: PageData;
  $: subscriptionSettings = data.subscriptionSettings;
  $: subscribedTags = data.subscribedTags as { subscribedTags: Tag[] };
  $: nonSubscribedTags = data.tags.filter(
    (tag) =>
      subscribedTags.subscribedTags.find((subTag) => tag.id == subTag.id) ==
      undefined,
  );
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
    <div
      class="m-2 flex w-full max-w-2xl flex-col items-center pl-2 pr-2 lg:p-0"
    >
      <h2 class="mb-2 text-2xl font-bold">Notifikationer</h2>
      {#each Object.entries(NotificationSettingType) as notificationSettingType}
        <NotificationSetting
          subscription={subscriptionSettings.find(
            (subscription) => subscription.type == notificationSettingType[0],
          )}
          notificationSettingType={notificationSettingType[0]}
        />
      {/each}
    </div>
    <div
      class="m-2 flex w-full max-w-2xl flex-col items-center pl-2 pr-2 lg:p-0"
    >
      <h2 class="mb-2 text-2xl font-bold">Nyhetsprenumerationer</h2>
      <SubscriptionTags {subscribedTags} {nonSubscribedTags} />
    </div>
    <button
      class="btn absolute bottom-0 mt-4 w-full max-w-xl bg-primary"
      type="submit">Tillämpa</button
    >
  </form>
</div>
