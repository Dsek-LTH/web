<script lang="ts">
  import DualSelect from "$lib/components/dualSelect/DualSelect.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
  import type { NotificationSettingType } from "$lib/utils/notifications/types";
  import { availableLanguageTags, languageTag } from "$paraglide/runtime";
  import { mode, setMode } from "mode-watcher";
  import * as m from "$paraglide/messages";

  const { data } = $props();

  let items: { title: string; checked: boolean; color: string | null }[] =
    $state(
      data.tags.map((tag) => ({
        title: tag.name,
        color: tag.color,
        checked:
          (data.subscribedTags?.subscribedTags.filter(
            (subscribedTag) => subscribedTag.name === tag.name,
          ).length ?? 0) > 0,
      })),
    );
  let selectedLanguage = $derived(languageTag());
  const tagToLanguage = (tag: "en" | "sv") =>
    tag === "en" ? "Engelska" : "Svenska";
  const modeTranslation = (mode: "dark" | "light" | "system") => {
    switch (mode) {
      case "dark":
        return "Mörkt";
      case "light":
        return "Ljust";
      default:
        return "System";
    }
  };
  const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

  const notificationText: Record<NotificationSettingType, () => string> = {
    LIKE: m.setting_like,
    COMMENT: m.setting_comment,
    MENTION: m.setting_mention,
    NEW_ARTICLE: m.setting_new_article,
    EVENT_GOING: m.setting_event_going,
    CREATE_MANDATE: m.setting_create_mandate,
    BOOKING_REQUEST: m.setting_booking_request,
    PING: m.setting_ping,
    PURCHASES: m.setting_purchases,
  } as const;

  const getNotificationText = (text: NotificationSettingType) => {
    return notificationText[text](); // Type cast string to string literal
  };
</script>

<div class="flex flex-col [&_h2]:mt-10 [&_h2]:mb-6 [&_h4]:mb-3">
  <h2 class="!mt-0">Utseende</h2>
  <div class="flex flex-row">
    <div>
      <h4>Språk</h4>
      <Select.Root type="single" name="language">
        <Select.Trigger class="w-36"
          >{tagToLanguage(selectedLanguage)}</Select.Trigger
        >
        <Select.Content>
          <Select.Group>
            <Select.Label>Språk</Select.Label>
            {#each availableLanguageTags as lan (lan)}
              <Select.Item value={lan} label={tagToLanguage(lan)} />
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
    <div class="ml-10">
      <h4>Läge</h4>
      <Select.Root
        type="single"
        name="language"
        onValueChange={(value) =>
          setMode(value as any as "dark" | "light" | "system")}
      >
        <Select.Trigger class="w-36"
          >{modeTranslation(mode.current ?? "light")}</Select.Trigger
        >
        <Select.Content>
          <Select.Group>
            <Select.Label>Läge</Select.Label>
            {#each modes as mode (mode)}
              <Select.Item value={mode} label={modeTranslation(mode)} />
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
  </div>
  <h2>Notifikationer</h2>
  <div class="flex flex-row">
    <div></div>
    <div class="flex w-full flex-col gap-2 md:w-[400px]">
      <h4>Prenumerationer</h4>
      <DualSelect bind:items />
    </div>
  </div>
</div>
