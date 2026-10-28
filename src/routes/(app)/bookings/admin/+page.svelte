<script lang="ts">
  import dayjs from "dayjs";
  import * as m from "$paraglide/messages";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import Button, {
    buttonVariants,
  } from "$lib/components/ui/button/button.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import { enhance } from "$app/forms";
  import { cn } from "$lib/utils";
  import DOMPurify from "isomorphic-dompurify";
  import {
    PencilIcon,
    Trash2Icon,
    ArrowLeftIcon,
    ClipboardCheckIcon,
    ListChecksIcon,
  } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const statusClass = {
    ACCEPTED: "text-primary",
    PENDING: "text-lila-400",
    DENIED: "text-destructive",
  } as const;

  const statusLabel = {
    ACCEPTED: m.booking_accepted(),
    PENDING: m.booking_pending(),
    DENIED: m.booking_denied(),
  } as const;

  const pendingCount = $derived(
    data.bookingRequests.filter(
      ({ status, end }) =>
        status === "PENDING" && !!end && new Date(end) >= new Date(),
    ).length,
  );
</script>

{#snippet deleteDialog(
  bookingRequest: PageData["bookingRequests"][number],
  size: "icon-sm" | "icon",
)}
  <AlertDialog.Root>
    <AlertDialog.Trigger
      type="button"
      class={cn(
        buttonVariants({ variant: "outline", size }),
        "border-destructive text-destructive hover:bg-destructive/10",
      )}
      aria-label={m.booking_delete()}
    >
      <Trash2Icon class="size-4" />
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <form method="POST" action="?/delete" use:enhance>
        <input hidden name="id" type="text" value={bookingRequest.id} />
        <AlertDialog.Header>
          <AlertDialog.Title>{m.booking_deleteTitle()}</AlertDialog.Title>
          <AlertDialog.Description>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html m.booking_deleteAreYouSure({
              name: DOMPurify.sanitize(bookingRequest.booker?.firstName ?? ""),
              bookables: DOMPurify.sanitize(
                bookingRequest.bookables.map(({ name }) => name).join(", "),
              ),
            })}
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel type="button">
            {m.cancel()}
          </AlertDialog.Cancel>
          <AlertDialog.Action type="submit">
            {m.booking_delete()}
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </form>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/snippet}

<div class="layout-container">
  <div
    class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
  >
    <h2>
      {m.booking_manageBookings()}
    </h2>
    <div class="flex gap-2 *:flex-1 sm:*:flex-none">
      <Button variant="outline" href="/bookings">
        <ArrowLeftIcon class="size-4" />
        {m.booking_goBack()}
      </Button>
      {#if pendingCount > 0}
        <Button href="/bookings/admin/review">
          <ListChecksIcon class="size-4" />
          {m.booking_reviewPending({ count: pendingCount })}
        </Button>
      {/if}
    </div>
  </div>

  <!-- MOBILE -->
  <ul class="ml-0 list-none space-y-3 md:hidden">
    {#each data.bookingRequests as bookingRequest (bookingRequest.id)}
      <li class="bg-muted-background space-y-2 rounded-lg border p-4">
        <div class="flex items-start justify-between gap-3">
          <a
            href="/bookings/admin/{bookingRequest.id}"
            class="min-w-0 font-semibold break-words hover:underline"
          >
            {bookingRequest.event}
          </a>
          <span
            class={`shrink-0 text-xs font-semibold uppercase ${statusClass[bookingRequest.status]}`}
          >
            {statusLabel[bookingRequest.status]}
          </span>
        </div>
        <p class="text-sm">
          {bookingRequest.bookables.map(({ name }) => name).join(", ")}
        </p>
        <p class="text-muted-foreground text-sm tabular-nums">
          {dayjs(bookingRequest.start).format("YYYY-MM-DD HH:mm")} – {dayjs(
            bookingRequest.end,
          ).format("YYYY-MM-DD HH:mm")}
        </p>
        <div class="flex items-center justify-between gap-2 pt-1">
          {#if bookingRequest.booker}
            <a
              href="/members/{bookingRequest.booker.studentId}"
              class="flex min-w-0 items-center gap-2 text-sm hover:underline"
            >
              <MemberAvatar member={bookingRequest.booker} />
              <span class="truncate">
                {getFullName(bookingRequest.booker, { hideNickname: true })}
              </span>
            </a>
          {/if}
          <div class="ml-auto flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              href="/bookings/admin/{bookingRequest.id}"
              aria-label={m.booking_reviewBooking()}
            >
              <ClipboardCheckIcon class="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              href="/bookings/{bookingRequest.id}/edit"
              aria-label={m.booking_edit()}
            >
              <PencilIcon class="size-4" />
            </Button>
            {@render deleteDialog(bookingRequest, "icon")}
          </div>
        </div>
      </li>
    {:else}
      <li class="text-muted-foreground py-12 text-center">
        {m.booking_noBookings()}
      </li>
    {/each}
  </ul>

  <!-- DESKTOP -->
  <div class="hidden rounded-md border md:block">
    <Table.Root class="table-fixed">
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.booking_booking()}</Table.Head>
          <Table.Head>{m.booking_from()}</Table.Head>
          <Table.Head>{m.booking_until()}</Table.Head>
          <Table.Head>{m.booking_event()}</Table.Head>
          <Table.Head>{m.booking_responsible()}</Table.Head>
          <Table.Head>{m.booking_status()}</Table.Head>
          <Table.Head></Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.bookingRequests as bookingRequest (bookingRequest.id)}
          <Table.Row>
            <Table.Cell class="truncate">
              {#each bookingRequest.bookables as bookable (bookable.id)}
                <p class="truncate" title={bookable.name}>{bookable.name}</p>
              {/each}
            </Table.Cell>
            <Table.Cell>
              {dayjs(bookingRequest.start).format("YYYY-MM-DD HH:mm")}
            </Table.Cell>
            <Table.Cell>
              {dayjs(bookingRequest.end).format("YYYY-MM-DD HH:mm")}
            </Table.Cell>
            <Table.Cell
              class="max-w-0 truncate"
              title={bookingRequest.event ?? ""}
            >
              <a
                href="/bookings/admin/{bookingRequest.id}"
                class="hover:underline"
              >
                {bookingRequest.event}
              </a>
            </Table.Cell>
            <Table.Cell class="max-w-0">
              {#if bookingRequest.booker}
                <div class="flex items-center gap-2">
                  <MemberAvatar
                    member={bookingRequest.booker}
                    class="size-5 flex-shrink-0"
                  />
                  <a
                    href="/members/{bookingRequest.booker.studentId}"
                    class="truncate hover:underline"
                  >
                    {getFullName(bookingRequest.booker, {
                      hideNickname: true,
                    })}
                  </a>
                </div>
              {/if}
            </Table.Cell>
            <Table.Cell>
              <span
                class={`text-xs font-semibold uppercase ${statusClass[bookingRequest.status]}`}
              >
                {statusLabel[bookingRequest.status]}
              </span>
            </Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  href="/bookings/admin/{bookingRequest.id}"
                  aria-label={m.booking_reviewBooking()}
                >
                  <ClipboardCheckIcon class="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  href="/bookings/{bookingRequest.id}/edit"
                  aria-label={m.booking_edit()}
                >
                  <PencilIcon class="size-4" />
                </Button>

                {@render deleteDialog(bookingRequest, "icon-sm")}
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={7} class="h-24 text-center">
              {m.booking_noBookings()}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
