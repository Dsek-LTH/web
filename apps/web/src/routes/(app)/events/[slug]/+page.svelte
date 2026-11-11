<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as Alert from "$lib/components/ui/alert";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import type { ActionType } from "$lib/events/schema";
  import * as m from "$paraglide/messages";

  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";

  import Event from "../Event.svelte";
  import InterestedGoingButtons from "../InterestedGoingButtons.svelte";
  import InterestedGoingList from "../InterestedGoingList.svelte";
  import CommentSection from "$lib/components/comments/CommentSection.svelte";

  let { data } = $props();

  const event = $derived(data.event);
  const going = $derived(event.going ?? []);
  const interested = $derived(event.interested ?? []);
  const isRecurring = $derived(!!event.recurringParentId);
  const isRemoved = $derived(event.removedAt != null);

  let removeType: ActionType = $state("THIS");

  const removeTypes: Array<{ value: ActionType; label: string }> = [
    { value: "THIS", label: m.events_deleteThisEvent() },
    { value: "FUTURE", label: m.events_deleteThisAndFutureEvents() },
    { value: "ALL", label: m.events_deleteAllEvents() },
  ];
</script>

<SetPageTitle title={event.title} />

{#if isRemoved}
  <Alert.Root variant="warning" class="mb-4">
    <CircleAlert />
    <Alert.Title>{m.events_removedNotice()}</Alert.Title>
  </Alert.Root>
{/if}

<Event {event}>
  {#snippet actions()}
    {#if data.canEdit}
      <Button
        variant="outline"
        href="/events/{event.slug}/edit"
        aria-label={m.events_edit()}
        title={m.events_edit()}><Pen /></Button
      >
    {/if}
    {#if data.canDelete && !isRemoved}
      {@render removeEvent()}
    {/if}
  {/snippet}

  {#snippet buttons()}
    {#if !isRemoved}
      <InterestedGoingButtons eventId={event.id} {interested} {going} />
    {/if}
  {/snippet}

  {#snippet after()}
    <InterestedGoingList {interested} {going} />
    <CommentSection
      type="EVENT"
      comments={event.comments ?? []}
      taggedMembers={data.allTaggedMembers}
      commentForm={data.commentForm}
      removeCommentForm={data.removeCommentForm}
    />
  {/snippet}
</Event>

{#snippet removeEvent()}
  <AlertDialog.Root>
    <AlertDialog.Trigger
      class={buttonVariants({ variant: "outline" })}
      aria-label={m.events_delete()}
      title={m.events_delete()}
    >
      <Trash />
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>
          {isRecurring ? m.events_thisIsRecurring() : m.events_dialog_title()}
        </AlertDialog.Title>
        {#if !isRecurring}
          <AlertDialog.Description>
            {m.events_dialog_desc()}
          </AlertDialog.Description>
        {/if}
      </AlertDialog.Header>
      {#if isRecurring}
        <RadioGroup.Root bind:value={removeType}>
          {#each removeTypes as { value, label } (value)}
            <div class="flex flex-row items-center gap-2">
              <RadioGroup.Item {value} id="removeType-{value}" />
              <Label for="removeType-{value}">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- static, trusted translation -->
                {@html label}
              </Label>
            </div>
          {/each}
        </RadioGroup.Root>
      {/if}
      <AlertDialog.Footer>
        <AlertDialog.Cancel>{m.cancel()}</AlertDialog.Cancel>
        <form action="?/removeEvent" method="POST">
          <input
            type="hidden"
            name="removeType"
            value={isRecurring ? removeType : "THIS"}
          />
          <AlertDialog.Action type="submit"
            >{m.events_delete()}</AlertDialog.Action
          >
        </form>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/snippet}
