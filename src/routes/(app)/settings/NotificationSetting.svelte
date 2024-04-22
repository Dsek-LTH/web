<script lang="ts">
  import type { SubscriptionSetting } from "@prisma/client";
  import { NotificationSettingTypeDescription } from "$lib/utils/notifications/types";

  // Undefined if user hasn't turned on notifications for this type
  export let subscription: SubscriptionSetting | undefined;
  export let notificationSettingType: string;
  const key =
    notificationSettingType as keyof typeof NotificationSettingTypeDescription;

  // Hide push setting if the normal setting is not on
  let hidePush: boolean = subscription != undefined;
</script>

<div class="m-2 w-full">
  <!-- Web notification -->
  <label class="m-2 flex cursor-pointer flex-row justify-between">
    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
      >{NotificationSettingTypeDescription[key]}</span
    >
    <input
      type="checkbox"
      value=""
      bind:checked={hidePush}
      class="peer sr-only"
    />
    <div
      class="peer relative h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"
    ></div>
  </label>

  <!-- Push notification -->
  <label
    class={!hidePush
      ? "hidden"
      : "m-2 flex cursor-pointer flex-row justify-between"}
  >
    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
      >Pushnotis</span
    >
    <input
      type="checkbox"
      value=""
      checked={subscription?.pushNotification}
      class="peer sr-only"
    />
    <div
      class="peer relative h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-gray-800"
    ></div>
  </label>
</div>
