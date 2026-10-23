<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { bookingSchema, type BookingSchema } from "$lib/bookings/schema";
  import { type SuperValidated, type Infer } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card/index";
  import {
    ArchiveIcon,
    Calendar1Icon,
    CalendarCheckIcon,
    CalendarIcon,
    ClockIcon,
    DoorOpenIcon,
    PartyPopperIcon,
    SendHorizontalIcon,
    CheckIcon,
    UsersIcon,
    XIcon,
    CircleAlert,
  } from "@lucide/svelte";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    getLocalTimeZone,
    parseDate,
    today,
    type DateValue,
  } from "@internationalized/date";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import {
    getStickyBottomOffset,
    stickyBottomClass,
  } from "$lib/bookings/stickyBottom";
  import * as m from "$paraglide/messages";
  import { untrack } from "svelte";
  import ChoiceBox from "$lib/components/ChoiceBox.svelte";
  import * as Alert from "$lib/components/ui/alert";

  const {
    data,
    mode = "create",
    booking,
    backHref = "/bookings",
  }: {
    data: {
      form: SuperValidated<Infer<BookingSchema>>;
      bookables: Array<
        ExtendedPrismaModel<"Bookable"> & {
          category: ExtendedPrismaModel<"BookableCategory">;
        }
      >;
      doors: Array<ExtendedPrismaModel<"Door">>;
      currentMemberSearchAttributes?:
        | (MemberSearchReturnAttributes & { id: string })
        | null;
      initialAccessMembers?: Array<
        MemberSearchReturnAttributes & { id: string }
      >;
    };
    mode?: "create" | "edit" | "review";
    booking?: { id: string; status: "ACCEPTED" | "PENDING" | "DENIED" };
    backHref?: string;
  } = $props();

  const form = $derived(
    superForm(data.form, {
      dataType: "json",
      validators: zod4Client(bookingSchema),
    }),
  );
  const bookables = $derived(data.bookables);

  const groupedBookables = $derived(
    Object.values(
      bookables.reduce(
        (acc, bookable) => {
          const catId = bookable.category?.id ?? "uncategorized";
          const catName = bookable.category?.name ?? m.booking_other();

          if (!acc[catId]) {
            acc[catId] = { categoryName: catName, items: [] };
          }
          acc[catId].items.push(bookable);
          return acc;
        },
        {} as Record<string, { categoryName: string; items: typeof bookables }>,
      ),
    ),
  );

  const doors = $derived(data.doors);

  const { form: formData, enhance } = $derived(form);

  let selectedAccessMembers = $derived<
    Array<MemberSearchReturnAttributes & { id: string }>
  >(
    data.currentMemberSearchAttributes
      ? [data.currentMemberSearchAttributes]
      : (data.initialAccessMembers ?? []),
  );

  // The bookable's own door should be obviously included among the
  // selectable doors once it's booked, without overriding manual edits. Only
  // newly selected bookables add their door, so unticking it again sticks.
  let previousBookables: string[] = untrack(
    () => data.form.data.bookables ?? [],
  );
  $effect(() => {
    const selected = $formData.bookables;
    const added = selected.filter((id) => !previousBookables.includes(id));
    previousBookables = [...selected];

    untrack(() => {
      const doorsToAdd = added
        .map((id) => bookables.find((b) => b.id === id)?.doorName)
        .filter(
          (doorName): doorName is string =>
            !!doorName && !$formData.accessDoors.includes(doorName),
        );
      if (doorsToAdd.length > 0) {
        $formData.accessDoors = [
          ...new Set([...$formData.accessDoors, ...doorsToAdd]),
        ];
      }
    });
  });

  const id = $props.id();
  const readOnly = $derived(mode === "review");
  const stickyBottom = $derived(getStickyBottomOffset());

  const sectionClass =
    "gap-3 border-none px-0.5 py-5 *:px-4 md:pt-8 md:pb-9 md:*:px-6";

  const splitDateTime = (value: string | undefined) => {
    if (!value) return { date: undefined, time: "" };
    const [datePart, timePart = ""] = value.split("T");

    return {
      date: datePart ? parseDate(datePart) : undefined,
      time: timePart.slice(0, 5),
    };
  };

  const initialStart = $derived(splitDateTime(data.form.data.start));
  const initialEnd = $derived(splitDateTime(data.form.data.end));

  let openStart = $state(false);
  let openEnd = $state(false);
  let selectedStartDate = $derived<DateValue | undefined>(initialStart.date);
  let selectedEndDate = $derived<DateValue | undefined>(initialEnd.date);
  let startTime = $derived(initialStart.time);
  let endTime = $derived(initialEnd.time);

  const normalizeTime = (time: string) => {
    const [h = "00", m = "00"] = time.split(":");

    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  $effect(() => {
    if (!selectedStartDate) return;

    const nextStart = `${selectedStartDate.toString()}T${normalizeTime(startTime)}`;
    if ($formData.start !== nextStart) {
      $formData.start = nextStart;
    }
  });

  $effect(() => {
    if (!selectedEndDate) return;

    if (
      selectedStartDate &&
      selectedEndDate.toString() < selectedStartDate.toString()
    ) {
      selectedEndDate = selectedStartDate;
    }

    const nextEnd = `${selectedEndDate.toString()}T${normalizeTime(endTime)}`;
    if ($formData.end !== nextEnd) {
      $formData.end = nextEnd;
    }
  });

  const boardRoomId = "99854837-fdb9-4dba-85fc-86a5c514253c";
  let showBoardRoomWarning = $derived(
    $formData.bookables.includes(boardRoomId),
  );
</script>

<div class="layout-container lg:w-3/5">
  <h2 class="mb-4">Skapa bokning</h2>
  <form class="space-y-2 md:space-y-8" method="POST" use:enhance>
    {#if booking}
      <input hidden name="id" type="text" value={booking.id} />
    {/if}

    <div class="flex w-full flex-col gap-2 md:flex-row md:gap-6">
      <Form.Field {form} name="start" class="w-full space-y-0">
        <Form.Control>
          {#snippet children({ props: test })}
            <Card.Root class={sectionClass}>
              <Card.Header>
                <Card.Title
                  class="text-primary flex items-center gap-2 text-xl font-semibold"
                >
                  <Calendar1Icon class="size-5" />
                  {m.booking_from()}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="flex gap-2">
                  <div class="w-1/2">
                    <Popover.Root bind:open={openStart}>
                      <Popover.Trigger id="date-start-{id}" disabled={readOnly}>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            {...test}
                            variant="outline"
                            disabled={readOnly}
                            class="w-full justify-between font-normal"
                          >
                            <CalendarIcon />
                            {selectedStartDate
                              ? selectedStartDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : m.booking_selectDate()}
                          </Button>
                        {/snippet}
                      </Popover.Trigger>
                      <Popover.Content
                        class="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          type="single"
                          bind:value={selectedStartDate}
                          captionLayout="dropdown"
                          onValueChange={() => {
                            openStart = false;
                          }}
                          minValue={today(getLocalTimeZone())}
                        />
                      </Popover.Content>
                    </Popover.Root>
                  </div>

                  <div class="w-1/2">
                    <Input
                      type="time"
                      id="time-start-{id}"
                      step="60"
                      disabled={readOnly}
                      bind:value={startTime}
                      class="bg-muted-background w-full cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    >
                      <ClockIcon class="text-foreground" />
                    </Input>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
            <input
              {...test}
              class="hidden"
              type="datetime"
              bind:value={$formData.start}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="end" class="w-full space-y-0">
        <Form.Control>
          {#snippet children({ props: test })}
            <Card.Root class={sectionClass}>
              <Card.Header>
                <Card.Title
                  class="text-primary flex items-center gap-2 text-xl font-semibold"
                >
                  <CalendarCheckIcon class="size-5" />
                  {m.booking_until()}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="flex gap-2">
                  <div class="w-1/2">
                    <Popover.Root bind:open={openEnd}>
                      <Popover.Trigger id="end-date-{id}" disabled={readOnly}>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            {...test}
                            variant="outline"
                            disabled={readOnly}
                            class="w-full justify-between font-normal"
                          >
                            <CalendarIcon />
                            {selectedEndDate
                              ? selectedEndDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : m.booking_selectDate()}
                          </Button>
                        {/snippet}
                      </Popover.Trigger>
                      <Popover.Content
                        class="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          type="single"
                          bind:value={selectedEndDate}
                          captionLayout="dropdown"
                          onValueChange={() => {
                            openEnd = false;
                          }}
                          minValue={selectedStartDate
                            ? selectedStartDate
                            : today(getLocalTimeZone())}
                        />
                      </Popover.Content>
                    </Popover.Root>
                  </div>

                  <div class="w-1/2">
                    <Input
                      type="time"
                      id="time-end-{id}"
                      step="60"
                      disabled={readOnly}
                      bind:value={endTime}
                      class="bg-muted-background w-full cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    >
                      <ClockIcon class="text-foreground" />
                    </Input>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
            <input
              {...test}
              class="hidden"
              type="datetime"
              bind:value={$formData.end}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>

    <Card.Root class={sectionClass}>
      <Card.Header>
        <Card.Title
          class="text-primary flex items-center gap-2 text-xl font-semibold"
        >
          <ArchiveIcon class="size-5" />
          {m.booking_booking()}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Form.Fieldset {form} name="bookables">
          {#each groupedBookables as category}
            <h6 class="text-muted-foreground">{category.categoryName}</h6>

            <div class="grid w-full grid-cols-2 gap-2">
              {#each category.items as bookable (bookable.id)}
                <Form.Control>
                  {#snippet children({ props })}
                    <ChoiceBox
                      {...props}
                      title={bookable.name}
                      value={bookable.id}
                      disabled={readOnly}
                      bind:group={$formData.bookables}
                      aria-label={bookable.name}
                    />
                  {/snippet}
                </Form.Control>
              {/each}
            </div>
          {/each}
          <Form.FieldErrors />
        </Form.Fieldset>
      </Card.Content>
    </Card.Root>

    {#if showBoardRoomWarning}
      <Alert.Root variant="warning">
        <Alert.Title class="flex flex-row items-center gap-2 text-lg"
          ><CircleAlert class="size-6" /> {m.booking_boardRoom()}</Alert.Title
        >
        <Alert.Description class="inline">
          {@html m.booking_boardRoomWarning()}
        </Alert.Description>
      </Alert.Root>
    {/if}

    <Card.Root class={sectionClass}>
      <Card.Header>
        <Card.Title
          class="text-primary flex items-center gap-2 text-xl font-semibold"
        >
          <DoorOpenIcon class="size-5" />
          {m.booking_doorAccess()}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Form.Fieldset {form} name="accessDoors">
          <div class="grid w-full grid-cols-2 gap-2">
            {#each doors as door (door.name)}
              <Form.Control>
                {#snippet children({ props })}
                  <ChoiceBox
                    {...props}
                    title={door.verboseName}
                    value={door.name}
                    disabled={readOnly}
                    bind:group={$formData.accessDoors}
                    aria-label={door.verboseName}
                  />
                {/snippet}
              </Form.Control>
            {/each}
          </div>
          <Form.FieldErrors />
        </Form.Fieldset>
      </Card.Content>
    </Card.Root>

    <Card.Root class={sectionClass}>
      <Card.Header>
        <Card.Title
          class="text-primary flex items-center gap-2 text-xl font-semibold"
        >
          <UsersIcon class="size-5" />
          {m.booking_doorAccessMembers()}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Form.Fieldset {form} name="accessMemberIds">
          <MemberSelector
            multiple={true}
            showId={false}
            showClass={true}
            class="w-full!"
            inputClass="min-h-12 w-full"
            bind:selectedMembers={selectedAccessMembers}
            bind:selectedMembersIds={$formData.accessMemberIds}
          />
          <Form.FieldErrors />
        </Form.Fieldset>
      </Card.Content>
    </Card.Root>

    <div class="space-y-4">
      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Card.Root class={sectionClass}>
              <Card.Header>
                <Card.Title
                  class="text-primary flex items-center gap-2 text-lg font-medium"
                >
                  <PartyPopperIcon class="size-4" />
                  {m.booking_event()}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <Input
                  {...props}
                  bind:value={$formData.name}
                  disabled={readOnly}
                  placeholder={m.booking_eventPlaceholder()}
                />
              </Card.Content>
            </Card.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>

    {#if mode === "review" && booking}
      <div
        class="{stickyBottomClass} bg-background sticky z-10 -mx-4 flex gap-3 px-4 py-3 *:flex-1 md:static md:mx-0 md:gap-4 md:p-0"
        style:bottom={stickyBottom}
      >
        <Form.Button
          formaction="?/reject"
          variant="outline"
          size="lg"
          class="border-destructive text-destructive hover:bg-destructive/10 flex items-center justify-center gap-3 py-6 text-base font-bold md:py-7"
          disabled={booking.status === "DENIED"}
        >
          <XIcon class="size-5" />
          {m.booking_deny()}
        </Form.Button>
        <Form.Button
          formaction="?/accept"
          size="lg"
          class="flex items-center justify-center gap-3 py-6 text-base font-bold md:py-7"
          disabled={booking.status === "ACCEPTED"}
        >
          <CheckIcon class="size-5" />
          {m.booking_accept()}
        </Form.Button>
      </div>
    {:else}
      <div
        class="{stickyBottomClass} bg-background sticky z-10 -mx-4 flex gap-3 px-4 py-3 *:flex-1 md:static md:mx-0 md:justify-end md:p-0 md:*:flex-none"
        style:bottom={stickyBottom}
      >
        <Button variant="outline" size="lg" href={backHref}>
          {m.booking_goBack()}
        </Button>
        <Form.Button size="lg">
          {mode === "edit" ? m.save() : m.booking_sendRequest()}
          <SendHorizontalIcon />
        </Form.Button>
      </div>
    {/if}
  </form>
</div>
