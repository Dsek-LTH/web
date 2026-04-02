<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { bookingSchema, type BookingSchema } from "../schema";
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
    FileTextIcon,
    PartyPopperIcon,
    SendHorizontalIcon,
  } from "@lucide/svelte";

  const { data }: { data: { form: SuperValidated<Infer<BookingSchema>> } } =
    $props();

  const form = $derived(
    superForm(data.form, {
      validators: zod4Client(bookingSchema),
    }),
  );

  const { form: formData, enhance } = $derived(form);

  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    getLocalTimeZone,
    today,
    type DateValue,
  } from "@internationalized/date";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";

  const id = $props.id();

  let openStart = $state(false);
  let openEnd = $state(false);
  let selectedStartDate = $state<DateValue | undefined>();
  let selectedEndDate = $state<DateValue | undefined>();
  let startTime = $state("");
  let endTime = $state("");

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

    const nextEnd = `${selectedEndDate.toString()}T${normalizeTime(endTime)}`;
    if ($formData.end !== nextEnd) {
      $formData.end = nextEnd;
    }
  });
</script>

<div class="layout-container w-3/5">
  <form class="space-y-8" method="POST" use:enhance>
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
                  Startdatum
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="flex gap-2">
                  <div class="w-1/2">
                    <Popover.Root bind:open={openStart}>
                      <Popover.Trigger id="date-start-{id}">
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            {...test}
                            variant="outline"
                            class="bg-muted hover:bg-muted w-full justify-between border-none font-normal"
                          >
                            {selectedStartDate
                              ? selectedStartDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : "Select date"}
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
                        />
                      </Popover.Content>
                    </Popover.Root>
                  </div>

                  <div class="w-1/2">
                    <Input
                      type="time"
                      id="time-start-{id}"
                      step="60"
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
                  Slutdatum
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="flex gap-2">
                  <div class="w-1/2">
                    <Popover.Root bind:open={openEnd}>
                      <Popover.Trigger id="end-date-{id}">
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            {...test}
                            variant="outline"
                            class="bg-muted hover:bg-muted w-full justify-between border-none font-normal"
                          >
                            {selectedEndDate
                              ? selectedEndDate
                                  .toDate(getLocalTimeZone())
                                  .toLocaleDateString()
                              : "Select date"}
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
                          maxValue={today(getLocalTimeZone())}
                        />
                      </Popover.Content>
                    </Popover.Root>
                  </div>

                  <div class="w-1/2">
                    <Input
                      type="time"
                      id="time-end-{id}"
                      step="60"
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

    {#snippet test(props: object, value: string, label: string)}
      <ToggleGroup.Item
        {...props}
        {value}
        aria-label="Toggle bold"
        class="group data-[state=on]:bg-primary/10 data-[state=on]:text-primary bg-muted hover:bg-primary/10 hover:text-primary justify-start rounded-md border-none px-4 py-8 text-base font-medium transition-all duration-100 ease-out hover:-translate-y-0.5 active:scale-95"
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
        />
      </ToggleGroup.Item>
    {/snippet}
    <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
      <Card.Header>
        <Card.Title
          class="text-primary flex items-center gap-2 text-xl font-semibold"
        >
          <ArchiveIcon class="size-5" />
          Vad ska bokas?
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Form.Fieldset {form} name="bookables">
          <ToggleGroup.Root
            bind:value={$formData.bookables}
            variant="outline"
            type="multiple"
            spacing={3}
            class="grid w-full grid-cols-3"
          >
            <Form.Control>
              {#snippet children({ props })}
                {@render test(props, "styrelserummet", "Styrelserummet")}
                <!-- <ToggleGroup.Item {...props} value="apple" aria-label="Toggle bold">
              <BoldIcon class="size-4" />
              <input
                class="hidden"
                {...props}
                type="checkbox"
                bind:group={$formData.bookables}
                value="apple"
              />
            </ToggleGroup.Item> -->
              {/snippet}
            </Form.Control>

            <Form.Control>
              {#snippet children({ props })}
                <!-- <ToggleGroup.Item
              {...props}
              value="banana"
              aria-label="Toggle italic"
            >
              <ItalicIcon class="size-4" />
              <input
                class="hidden"
                {...props}
                type="checkbox"
                bind:group={$formData.bookables}
                value="banana"
              />
            </ToggleGroup.Item> -->
                {@render test(props, "idet", "iDét")}
              {/snippet}
            </Form.Control>

            <Form.Control>
              {#snippet children({ props })}
                <!-- <ToggleGroup.Item
              {...props}
              value="pineapple"
              aria-label="Toggle strikethrough"
            >
              <UnderlineIcon class="size-4" />
              <input
                class="hidden"
                {...props}
                type="checkbox"
                bind:group={$formData.bookables}
                value="pineapple"
              />
            </ToggleGroup.Item> -->
                {@render test(props, "koket", "Köket")}
              {/snippet}
            </Form.Control>
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
                  Vad händer?
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <Input
                  {...props}
                  bind:value={$formData.name}
                  class="bg-muted border-none"
                  placeholder="T.ex: CPU-kväll, Styrelsemöte, etc."
                />
              </Card.Content>
            </Card.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="description">
        <Form.Control>
          {#snippet children({ props })}
            <Card.Root class="gap-3 border-none px-0.5 pt-8 pb-9">
              <Card.Header>
                <Card.Title
                  class="text-primary flex items-center gap-2 text-lg font-medium"
                >
                  <FileTextIcon class="size-4" />
                  Beskrivning
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <Textarea
                  class="bg-muted h-24 border-none"
                  placeholder="..."
                  {...props}
                  bind:value={$formData.name}
                />
              </Card.Content>
            </Card.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>

    <div class="flex justify-end">
      <Form.Button
        size="lg"
        class="flex items-center justify-center gap-3 py-7 text-base font-bold has-[>svg]:px-10"
        onclick={() => console.log($formData)}
      >
        Skicka förfrågan
        <SendHorizontalIcon class="size-5" />
      </Form.Button>
    </div>
  </form>
</div>
