<script lang="ts">
  import DualSelect from "$lib/components/dualSelect/DualSelect.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
  import { NotificationSettingType } from "$lib/utils/notifications/types";
  import { mode, setMode } from "mode-watcher";
  import * as m from "$paraglide/messages";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { updateSettings } from "./settings.remote";
  import * as Table from "$lib/components/ui/table/index.js";
  import { toast } from "$lib/stores/toast";

  const { data } = $props();

  let items: Array<{
    title: string;
    checked: boolean;
    color: string | null;
    value: string;
  }> = $state(
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
  // This is very cursed TODO: fix
  // const initialLocale = getLocale();
  // console.log(initialLocale);
  // let selectedLanguage = $state<"en" | "sv">(initialLocale);
  // let languageInitialized = false;
  // $effect(() => {
  //   const fun = async () => {
  //     const lang = selectedLanguage;
  //     console.log(selectedLanguage);
  //     if (!languageInitialized) {
  //       languageInitialized = true;
  //       return;
  //     }
  //
  //     await setLanguage(lang);
  //     setLocale(lang as "en" | "sv");
  //   };
  //   fun();
  // });
  // const languageTranslation = (lang: "en" | "sv") => {
  // return lang === "en" ? m.language_english() : m.language_swedish();
  // };

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
    return notificationText[text]();
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
    <!--
    TODO: Fix this
    <div>
      <h4>{m.setting_language()}</h4>
      <Select.Root type="single" name="language" bind:value={selectedLanguage}>
        <Select.Trigger class="w-36">
          {languageTranslation(selectedLanguage)}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Label>{m.setting_language()}</Select.Label>
            {#each locales as lan (lan)}
              <Select.Item value={lan} label={languageTranslation(lan)} />
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
    -->
    <div>
      <h4>{m.setting_mode()}</h4>
      <Select.Root
        type="single"
        name="mode"
        onValueChange={(value) => setMode(value as "dark" | "light" | "system")}
      >
        <Select.Trigger class="w-36"
          >{modeTranslation(mode.current ?? data.theme)}</Select.Trigger
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
  <form
    {...updateSettings.enhance(async ({ submit }) => {
      // By default the form is reset when submitted, and if you click it again your subscription settings will be cleared
      // This takes over the form lifecycle so that the reset doesn't happen
      await submit();
      toast(
        updateSettings.result?.message ?? "No status message found",
        updateSettings.result?.success ? "success" : "error",
      );
    })}
  >
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
            {#each Object.values(NotificationSettingType) as settingType (settingType)}
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
                      disabled={!switchStates[settingType].subscription}
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
