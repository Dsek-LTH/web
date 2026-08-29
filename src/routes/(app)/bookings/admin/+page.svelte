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
  import {
    CheckIcon,
    XIcon,
    PencilIcon,
    Trash2Icon,
    ArrowLeftIcon,
    ClipboardCheckIcon,
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
</script>

<div class="layout-container">
  <div class="mb-8 flex items-center justify-between gap-4">
    <h1 class="text-3xl font-semibold uppercase">
      {m.booking_manageBookings()}
    </h1>
    <Button variant="outline" href="/bookings">
      <ArrowLeftIcon class="size-4" />
      {m.booking_goBack()}
    </Button>
  </div>

  <div class="rounded-md border">
    <Table.Root class="table-fixed">
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[18%]">{m.booking_booking()}</Table.Head>
          <Table.Head class="w-[12%]">{m.booking_from()}</Table.Head>
          <Table.Head class="w-[12%]">{m.booking_until()}</Table.Head>
          <Table.Head class="w-[17%]">{m.booking_event()}</Table.Head>
          <Table.Head class="w-[14%]">{m.booking_responsible()}</Table.Head>
          <Table.Head class="w-[8%]">{m.booking_status()}</Table.Head>
          <Table.Head class="w-[19%]"></Table.Head>
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
              <form method="POST" use:enhance class="flex items-center gap-2">
                <input hidden name="id" type="text" value={bookingRequest.id} />
                <Button
                  variant="outline"
                  size="icon-sm"
                  href="/bookings/admin/{bookingRequest.id}"
                  aria-label={m.booking_reviewBooking()}
                >
                  <ClipboardCheckIcon class="size-4" />
                </Button>

                <Button
                  type="submit"
                  formaction="?/accept"
                  variant="outline"
                  size="icon-sm"
                  disabled={bookingRequest.status === "ACCEPTED"}
                  aria-label={m.booking_accept()}
                >
                  <CheckIcon class="size-4" />
                </Button>
                <Button
                  type="submit"
                  formaction="?/reject"
                  variant="outline"
                  size="icon-sm"
                  disabled={bookingRequest.status === "DENIED"}
                  aria-label={m.booking_deny()}
                  class="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <XIcon class="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  href="/bookings/{bookingRequest.id}/edit"
                  aria-label={m.booking_edit()}
                >
                  <PencilIcon class="size-4" />
                </Button>

                <AlertDialog.Root>
                  <AlertDialog.Trigger
                    type="button"
                    class={cn(
                      buttonVariants({ variant: "outline", size: "icon-sm" }),
                      "border-destructive text-destructive hover:bg-destructive/10",
                    )}
                    aria-label={m.booking_delete()}
                  >
                    <Trash2Icon class="size-4" />
                  </AlertDialog.Trigger>
                  <AlertDialog.Content>
                    <form method="POST" action="?/delete" use:enhance>
                      <input
                        hidden
                        name="id"
                        type="text"
                        value={bookingRequest.id}
                      />
                      <AlertDialog.Header>
                        <AlertDialog.Title
                          >{m.booking_deleteTitle()}</AlertDialog.Title
                        >
                        <AlertDialog.Description>
                          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                          {@html m.booking_deleteAreYouSure({
                            name: bookingRequest.booker?.firstName ?? "",
                            bookables: bookingRequest.bookables
                              .map(({ name }) => name)
                              .join(", "),
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
              </form>
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
