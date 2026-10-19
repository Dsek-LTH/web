<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import type { ActionType } from "$lib/events/schema";
  import * as m from "$paraglide/messages";

  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";

  import Event from "../Event.svelte";
  import InterestedGoingButtons from "../InterestedGoingButtons.svelte";
  import InterestedGoingList from "../InterestedGoingList.svelte";

  let { data } = $props();

  const event = $derived(data.event);
  const isRecurring = $derived(event.recurringParentId !== null);

  let removeType: ActionType = $state("THIS");

  const removeTypes: Array<{ value: ActionType; label: string }> = [
    { value: "THIS", label: m.events_deleteThisEvent() },
    { value: "FUTURE", label: m.events_deleteThisAndFutureEvents() },
    { value: "ALL", label: m.events_deleteAllEvents() },
  ];
</script>

<SetPageTitle title={event.title} />

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
    {#if data.canDelete}
      {@render removeEvent()}
    {/if}
  {/snippet}

  {#snippet buttons()}
    <InterestedGoingButtons
      eventId={event.id}
      interested={event.interested}
      going={event.going}
    />
  {/snippet}

  {#snippet after()}
    <InterestedGoingList interested={event.interested} going={event.going} />
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
