<script lang="ts">
  import DualSelect from "$lib/components/dualSelect/DualSelect.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
  import { NotificationSettingType } from "$lib/utils/notifications/types";
  import { availableLanguageTags, languageTag } from "$paraglide/runtime";
  import { mode, setMode } from "mode-watcher";
  import * as m from "$paraglide/messages";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { updateSettings } from "./settings.remote";
  import { setLanguage } from "$lib/utils/languages.remote";
  import { goto, invalidateAll } from "$app/navigation";
  import * as Table from "$lib/components/ui/table/index.js";

  const { data } = $props();

  let items: {
    title: string;
    checked: boolean;
    color: string | null;
    value: string;
  }[] = $state(
    data.tags.map((tag) => ({
      title: tag.name,
      color: tag.color,
      checked:
        (data.subscribedTags?.subscribedTags.filter(
          (subscribedTag) => subscribedTag.name === tag.name,
        ).length ?? 0) > 0,
      value: tag.id,
    })),
  );
  let selectedLanguage = $state<"en" | "sv">(
    (data.member?.language ?? languageTag()) as "en" | "sv",
  );

  const languageTranslation = (lang: "en" | "sv") => {
    return lang === "en" ? m.language_english() : m.language_swedish();
  };

  const modeTranslation = (mode: "dark" | "light" | "system") => {
    switch (mode) {
      case "dark":
        return m.setting_mode_dark();
      case "light":
        return m.setting_mode_light();
      default:
        return m.setting_mode_system();
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

  // Create reactive state for each switch that syncs with form fields and server data
  const switchStates = $state<
    Record<NotificationSettingType, { subscription: boolean; push: boolean }>
  >(
    Object.values(NotificationSettingType).reduce(
      (acc, settingType) => {
        acc[settingType] = {
          subscription: data.subscriptions.includes(settingType),
          push: data.pushSubscriptions.includes(settingType),
        };
        return acc;
      },
      {} as Record<
        NotificationSettingType,
        { subscription: boolean; push: boolean }
      >,
    ),
  );

  // Sync switch states to form fields when they change
  $effect(() => {
    Object.values(NotificationSettingType).forEach((settingType) => {
      const subscriptionKey = `subscription_${settingType}`;
      const pushKey = `push_${settingType}`;

      updateSettings.fields[subscriptionKey]?.set(
        switchStates[settingType].subscription,
      );
      updateSettings.fields[pushKey]?.set(switchStates[settingType].push);
    });
  });
</script>

<div class="flex flex-col [&_h2]:mt-10 [&_h2]:mb-6 [&_h4]:mb-3">
  <h2 class="!mt-0">{m.setting_appearance()}</h2>
  <div class="flex flex-row">
    <div>
      <h4>{m.setting_language()}</h4>
      <Select.Root
        type="single"
        name="language"
        onValueChange={async (e) => {
          const { redirect } = await setLanguage(e);
          goto(redirect, { invalidateAll: true });
        }}
        bind:value={selectedLanguage}
      >
        <Select.Trigger class="w-36">
          {languageTranslation(selectedLanguage)}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Label>{m.setting_language()}</Select.Label>
            {#each availableLanguageTags as lan (lan)}
              <Select.Item value={lan} label={languageTranslation(lan)} />
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
    <div class="ml-10">
      <h4>{m.setting_mode()}</h4>
      <Select.Root
        type="single"
        name="mode"
        onValueChange={(value) =>
          setMode(value as any as "dark" | "light" | "system")}
      >
        <Select.Trigger class="w-36"
          >{modeTranslation(data.theme)}</Select.Trigger
        >
        <Select.Content>
          <Select.Group>
            <Select.Label>{m.setting_mode()}</Select.Label>
            {#each modes as mode (mode)}
              <Select.Item value={mode} label={modeTranslation(mode)} />
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
  </div>
  <h2>{m.setting_notification()}</h2>
  <form {...updateSettings}>
    <div class="flex flex-col gap-8 md:flex-row">
      <div class="flex h-[400px] min-h-[400px] w-full flex-col md:w-[400px]">
        <h4>{m.setting_subscriptions()}</h4>
        <DualSelect bind:items name="tags" />
      </div>
      <div>
        <h4>{m.setting_notices()}</h4>

        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>{m.setting_event()}</Table.Head>
              <Table.Head>{m.setting_in_app()}</Table.Head>
              <Table.Head>{m.setting_push_column()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each Object.values(NotificationSettingType) as settingType}
              {@const subscriptionKey = `subscription_${settingType}`}
              {@const pushKey = `push_${settingType}`}

              <Table.Row>
                <Table.Cell>{getNotificationText(settingType)}</Table.Cell>
                <Table.Cell>
                  {#if updateSettings.fields[subscriptionKey]}
                    <Switch
                      name={subscriptionKey}
                      bind:checked={switchStates[settingType].subscription}
                    />
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  {#if updateSettings.fields[pushKey]}
                    <Switch
                      name={pushKey}
                      bind:checked={switchStates[settingType].push}
                    />
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
    <Button class="mt-5" type="submit">{m.save()}</Button>
  </form>
</div>
