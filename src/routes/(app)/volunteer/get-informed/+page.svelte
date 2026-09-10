<script lang="ts">
  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import GuideCard from "../GuideCard.svelte";
  import Smartphone from "@lucide/svelte/icons/smartphone";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Tag from "@lucide/svelte/icons/tag";
  import Bell from "@lucide/svelte/icons/bell";
  import BellRing from "@lucide/svelte/icons/bell-ring";
  import Settings from "@lucide/svelte/icons/settings";
  import { siInstagram, siFacebook, siDiscord } from "simple-icons";
  import { resolve } from "$app/paths";

  const APP_STORE =
    "https://apps.apple.com/se/app/d-sektionen/id6444569402?l=en";
  const PLAY_STORE = "https://play.google.com/store/apps/details?id=se.dsek";
  const DISCORD = "https://discord.com/invite/wxHQcvZ38p";

  const socials = [
    {
      name: "Instagram",
      href: "https://instagram.com/dseklth",
      icon: siInstagram,
    },
    {
      name: "Facebook",
      href: "https://facebook.com/Dsektionen",
      icon: siFacebook,
    },
  ] as const;

  // Send the visitor straight to their own store instead of making them pick.
  // Undefined during SSR and on desktop, where we show both links instead.
  let platform = $derived.by<"ios" | "android" | undefined>(() => {
    if (typeof navigator === "undefined") return undefined;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return undefined;
  });

  const notificationSteps = [
    {
      title: m.volunteer_notifications_tags_title,
      desc: m.volunteer_notifications_tags_desc,
      icon: Tag,
    },
    {
      title: m.volunteer_notifications_types_title,
      desc: m.volunteer_notifications_types_desc,
      icon: Bell,
    },
    {
      title: m.volunteer_notifications_push_title,
      desc: m.volunteer_notifications_push_desc,
      icon: BellRing,
    },
    {
      title: m.volunteer_notifications_discord_title,
      desc: m.volunteer_notifications_discord_desc,
      icon: Share2,
    },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1>{m.volunteer_informed_title()}</h1>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_informed_subtitle()}
    </p>
  </header>

  <section class="flex flex-col gap-4">
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- The app card links straight to the right store when we can tell. -->
      <GuideCard
        title={m.volunteer_informed_step1_title()}
        description={m.volunteer_informed_app_desc()}
        icon={Smartphone}
        index={0}
      >
        {#if platform}
          <Button
            href={platform === "ios" ? APP_STORE : PLAY_STORE}
            target="_blank"
            rel="noreferrer"
            class="w-fit"
          >
            {m.volunteer_informed_app_cta()}
          </Button>
        {:else}
          <div class="flex flex-wrap gap-2">
            <Button href={APP_STORE} target="_blank" rel="noreferrer">
              {m.volunteer_informed_app_ios()}
            </Button>
            <Button
              href={PLAY_STORE}
              variant="outline"
              target="_blank"
              rel="noreferrer"
            >
              {m.volunteer_informed_app_android()}
            </Button>
          </div>
        {/if}
      </GuideCard>

      <GuideCard
        title={m.volunteer_informed_step5_title()}
        description={m.volunteer_informed_calendar_desc()}
        icon={Calendar}
        href={resolve("/(app)/events/subscribe")}
        cta={m.volunteer_informed_calendar_cta()}
        index={1}
      />

      <GuideCard
        title={m.volunteer_informed_discord_title()}
        description={m.volunteer_informed_discord_desc()}
        icon={Share2}
        href={DISCORD}
        external
        cta={m.volunteer_informed_discord_cta()}
        index={2}
      />

      <GuideCard
        title={m.volunteer_informed_social_title()}
        description={m.volunteer_informed_social_desc()}
        icon={Share2}
        index={3}
        class="md:col-span-2 lg:col-span-3"
      >
        <div class="flex items-center gap-4">
          {#each socials as social (social.name)}
            <a
              href={social.href}
              target="_blank"
              rel="noreferrer"
              class="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
            >
              <svg
                role="img"
                fill="currentColor"
                height="20"
                width="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><title>{social.name}</title><path d={social.icon.path} /></svg
              >
              <span class="text-sm">{social.name}</span>
            </a>
          {/each}
          <a
            href={DISCORD}
            target="_blank"
            rel="noreferrer"
            class="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
          >
            <svg
              role="img"
              fill="currentColor"
              height="20"
              width="20"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><title>Discord</title><path d={siDiscord.path} /></svg
            >
            <span class="text-sm">Discord</span>
          </a>
        </div>
      </GuideCard>
    </div>

    <p class="text-muted-foreground text-sm">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- translated string contains mailto links -->
      {@html m.volunteer_informed_help_html()}
    </p>
  </section>

  <Separator />

  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-3">
      <h2>{m.volunteer_notifications_title()}</h2>
      <p class="text-muted-foreground max-w-3xl leading-relaxed">
        {m.volunteer_notifications_subtitle()}
      </p>
      <Button href={resolve("/(app)/settings")} class="w-fit gap-2">
        <Settings class="size-4" />
        {m.volunteer_notifications_cta()}
      </Button>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      {#each notificationSteps as step, index (step.title)}
        <GuideCard
          title={step.title()}
          description={step.desc()}
          icon={step.icon}
          {index}
        />
      {/each}
    </div>
  </section>
</div>
