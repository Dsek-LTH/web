<script lang="ts">
  import { ArrowLeftIcon } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import * as m from "$paraglide/messages";
  import BookingsForm from "$lib/bookings/components/BookingsForm.svelte";
  import type { PageData } from "./$types.js";

  let { data }: { data: PageData } = $props();
</script>

<div class="layout-container mt-6 w-3/5 space-y-6">
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold uppercase">{m.booking_reviewBooking()}</h1>
    <Button variant="outline" href="/bookings/admin">
      <ArrowLeftIcon class="size-4" />
      {m.booking_goBack()}
    </Button>
  </div>

  {#if data.booking.booker}
    <div class="flex items-center gap-2">
      <MemberAvatar member={data.booking.booker} class="size-6" />
      <a
        href="/members/{data.booking.booker.studentId}"
        class="hover:underline"
      >
        {getFullName(data.booking.booker, { hideNickname: true })}
      </a>
    </div>
  {/if}
</div>

<BookingsForm {data} mode="review" booking={data.booking} />
