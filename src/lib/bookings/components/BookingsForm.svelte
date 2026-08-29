<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { bookingSchema, type BookingSchema } from "$lib/bookings/schema";
  import { type SuperValidated, type Infer } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card/index";
  import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
  import {
    ArchiveIcon,
    Calendar1Icon,
    CalendarCheckIcon,
    CalendarIcon,
    CircleCheckBigIcon,
    ClockIcon,
    PartyPopperIcon,
    SendHorizontalIcon,
    CheckIcon,
    XIcon,
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
  import * as m from "$paraglide/messages";

  const {
    data,
    mode = "create",
    booking,
    backHref = "/bookings",
  }: {
    data: {
      form: SuperValidated<Infer<BookingSchema>>;
      bookables: Array<ExtendedPrismaModel<"Bookable">>;
    };
    mode?: "create" | "edit" | "review";
    booking?: { id: string; status: "ACCEPTED" | "PENDING" | "DENIED" };
    backHref?: string;
  } = $props();

  const form = $derived(
    superForm(data.form, {
      validators: zod4Client(bookingSchema),
    }),
  );
  const bookables = $derived(data.bookables);

  const { form: formData, enhance } = $derived(form);

  const id = $props.id();
  const readOnly = $derived(mode === "review");

  const splitDateTime = (value: string | undefined) => {
    if (!value) return { date: undefined, time: "" };
    const [datePart, timePart = ""] = value.split("T");

    return {
      date: datePart ? parseDate(datePart) : undefined,
      time: timePart.slice(0, 5),
    };
  };

  const initialStart = splitDateTime(data.form.data.start);
  const initialEnd = splitDateTime(data.form.data.end);

  let openStart = $state(false);
  let openEnd = $state(false);
  let selectedStartDate = $state<DateValue | undefined>(initialStart.date);
  let selectedEndDate = $state<DateValue | undefined>(initialEnd.date);
  let startTime = $state(initialStart.time);
  let endTime = $state(initialEnd.time);

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
</script>

<div class="layout-container w-3/5">
  <form class="space-y-8" method="POST" use:enhance>
    {#if booking}
      <input hidden name="id" type="text" value={booking.id} />
    {/if}

    <div class="flex w-full gap-6">
      <Form.Field {form} name="start" class="w-full space-y-0">
        <Form.Control>
          {#snippet children({ props: test })}
            <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
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
                            class="bg-muted hover:bg-muted w-full justify-between border-none font-normal"
                          >
                            {selectedStartDate
                              ? selectedStartDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : m.booking_selectDate()}
                            <CalendarIcon />
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
                      class="bg-muted w-full cursor-pointer appearance-none border-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
            <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
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
                            class="bg-muted hover:bg-muted w-full justify-between border-none font-normal"
                          >
                            {selectedEndDate
                              ? selectedEndDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : m.booking_selectDate()}
                            <CalendarIcon />
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
                      class="bg-muted w-full cursor-pointer appearance-none border-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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

    {#snippet bookableItem(props: object, value: string, label: string)}
      <ToggleGroup.Item
        {...props}
        {value}
        disabled={readOnly}
        aria-label={label}
        class="group data-[state=on]:bg-primary/10 data-[state=on]:text-primary bg-muted hover:bg-primary/10 hover:text-primary h-auto justify-start rounded-md border-none px-4 py-8 text-base font-medium whitespace-normal transition-all duration-100 ease-out hover:-translate-y-0.5 active:scale-95"
      >
        <div class="flex w-full items-center justify-between gap-3">
          {label}
          <CircleCheckBigIcon
            class="text-primary size-5 scale-75 transform-gpu opacity-0 transition-all duration-100 ease-in group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
          />
        </div>
        <input
          class="hidden"
          {...props}
          type="checkbox"
          bind:group={$formData.bookables}
          {value}
          disabled={readOnly}
        />
      </ToggleGroup.Item>
    {/snippet}
    <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
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
          <ToggleGroup.Root
            bind:value={$formData.bookables}
            variant="outline"
            type="multiple"
            spacing={3}
            disabled={readOnly}
            class="grid w-full grid-cols-2"
          >
            {#each bookables as bookable (bookable.id)}
              <Form.Control>
                {#snippet children({ props })}
                  {@render bookableItem(props, bookable.id, bookable.name)}
                {/snippet}
              </Form.Control>
            {/each}
          </ToggleGroup.Root>
          <Form.FieldErrors />
        </Form.Fieldset>
      </Card.Content>
    </Card.Root>

    <div class="space-y-4">
      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
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
                  class="bg-muted border-none"
                  placeholder="T.ex: CPU-kväll, Styrelsemöte, etc."
                />
              </Card.Content>
            </Card.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>

    {#if mode === "review" && booking}
      <div class="flex gap-4 *:flex-1">
        <Form.Button
          formaction="?/reject"
          variant="outline"
          size="lg"
          class="border-destructive text-destructive hover:bg-destructive/10 flex items-center justify-center gap-3 py-7 text-base font-bold"
          disabled={booking.status === "DENIED"}
        >
          <XIcon class="size-5" />
          {m.booking_deny()}
        </Form.Button>
        <Form.Button
          formaction="?/accept"
          size="lg"
          class="flex items-center justify-center gap-3 py-7 text-base font-bold"
          disabled={booking.status === "ACCEPTED"}
        >
          <CheckIcon class="size-5" />
          {m.booking_accept()}
        </Form.Button>
      </div>
    {:else}
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          size="lg"
          class="py-7 text-base font-bold"
          href={backHref}
        >
          {m.booking_goBack()}
        </Button>
        <Form.Button
          size="lg"
          class="flex items-center justify-center gap-3 py-7 text-base font-bold has-[>svg]:px-10"
        >
          {mode === "edit" ? m.save() : m.booking_sendRequest()}
          <SendHorizontalIcon class="size-5" />
        </Form.Button>
      </div>
    {/if}
  </form>
</div>
