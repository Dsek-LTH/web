<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select";
  import { NotificationType } from "$lib/utils/notifications/types";
  import {
    createDebugNotification,
    sendDebugNotification,
  } from "./debug.remote";

  const types = Object.values(NotificationType);

  type Preset = {
    label: string;
    title: string;
    message: string;
    type: NotificationType;
    link: string;
  };

  let title = $state("Test notification");
  let message = $state("This is a test notification");
  let type = $state<string>(NotificationType.PING);
  let link = $state("/");
  let count = $state(1);
  let fromSelf = $state(true);
  let memberIds = $state("");

  const presets: Preset[] = [
    {
      label: "Ping",
      title: "PING!",
      message: "Someone pinged you",
      type: NotificationType.PING,
      link: "/",
    },
    {
      label: "News like",
      title: "Cool article",
      message: "Someone liked your article",
      type: NotificationType.NEWS_LIKE,
      link: "/news",
    },
    {
      label: "Comment",
      title: "Cool article",
      message: "Someone commented on your article",
      type: NotificationType.COMMENT,
      link: "/news",
    },
    {
      label: "Mention",
      title: "You were mentioned",
      message: "Someone mentioned you in a comment",
      type: NotificationType.MENTION,
      link: "/news",
    },
    {
      label: "Event going",
      title: "Pub",
      message: "Someone is going to your event",
      type: NotificationType.EVENT_GOING,
      link: "/events",
    },
    {
      label: "Booking request",
      title: "Booking request",
      message: "A new booking is awaiting approval",
      type: NotificationType.BOOKING_REQUEST,
      link: "/booking",
    },
  ];

  function applyPreset(preset: Preset) {
    title = preset.title;
    message = preset.message;
    type = preset.type;
    link = preset.link;
  }
</script>

<svelte:head>
  <title>Notifications debug</title>
</svelte:head>

<div class="container mx-auto flex max-w-2xl flex-col gap-6 py-8">
  <header>
    <h1 class="text-2xl font-bold">Notifications debug</h1>
    <p class="text-muted-foreground text-sm">
      Dev-only tool for creating test notifications. Only available in
      development mode.
    </p>
  </header>

  <section class="flex flex-col gap-2">
    <h2 class="text-sm font-semibold">Presets</h2>
    <div class="flex flex-wrap gap-2">
      {#each presets as preset (preset.label)}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => applyPreset(preset)}>{preset.label}</Button
        >
      {/each}
    </div>
  </section>

  <form
    {...createDebugNotification}
    class="bg-card flex flex-col gap-4 rounded-md border p-4"
  >
    <h2 class="text-lg font-semibold">Create directly (just for me)</h2>
    <p class="text-muted-foreground text-sm">
      Writes a notification straight to the database for the logged-in user.
      Skips subscription checks and push notifications.
    </p>

    <div class="flex flex-col gap-2">
      <Label for="dbg-title">Title</Label>
      <Input id="dbg-title" name="title" bind:value={title} required />
    </div>

    <div class="flex flex-col gap-2">
      <Label for="dbg-message">Message</Label>
      <Textarea id="dbg-message" name="message" bind:value={message} required />
    </div>

    <div class="flex flex-col gap-2">
      <Label for="dbg-type">Type</Label>
      <Select.Root type="single" bind:value={type} name="type">
        <Select.Trigger id="dbg-type">{type}</Select.Trigger>
        <Select.Content>
          {#each types as t (t)}
            <Select.Item value={t}>{t}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="dbg-link">Link</Label>
      <Input id="dbg-link" name="link" bind:value={link} required />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <Label for="dbg-count">Count</Label>
        <Input
          id="dbg-count"
          name="count"
          type="number"
          min="1"
          max="50"
          bind:value={count}
        />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="dbg-fromSelf">From me (author)</Label>
        <input
          id="dbg-fromSelf"
          name="fromSelf"
          type="checkbox"
          bind:checked={fromSelf}
          class="size-5"
        />
      </div>
    </div>

    <Button type="submit">Create</Button>
    {#if createDebugNotification.result}
      <p class="text-sm">{createDebugNotification.result.message}</p>
    {/if}
  </form>

  <form
    {...sendDebugNotification}
    class="bg-card flex flex-col gap-4 rounded-md border p-4"
  >
    <h2 class="text-lg font-semibold">Dispatch via sendNotification</h2>
    <p class="text-muted-foreground text-sm">
      Goes through the full pipeline (subscription settings, push). Defaults to
      yourself if no member IDs are given.
    </p>

    <input type="hidden" name="title" bind:value={title} />
    <input type="hidden" name="message" bind:value={message} />
    <input type="hidden" name="type" bind:value={type} />
    <input type="hidden" name="link" bind:value={link} />
    <input type="hidden" name="count" bind:value={count} />
    <input type="hidden" name="fromSelf" value={fromSelf ? "true" : "false"} />

    <div class="flex flex-col gap-2">
      <Label for="dbg-memberIds">Member IDs (comma/space separated)</Label>
      <Textarea
        id="dbg-memberIds"
        name="memberIds"
        bind:value={memberIds}
        placeholder="Leave empty to send only to yourself"
      />
    </div>

    <Button type="submit" variant="outline">Dispatch</Button>
    {#if sendDebugNotification.result}
      <p class="text-sm">{sendDebugNotification.result.message}</p>
    {/if}
  </form>
</div>
