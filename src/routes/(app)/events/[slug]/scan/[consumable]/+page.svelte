<script lang="ts">
  import { page } from "$app/stores";
  import dayjs from "dayjs";
  import { invalidateAll } from "$app/navigation";
  import * as m from "$paraglide/messages";
  import { enhance } from "$app/forms";

  const slug = $page.params["slug"];
  export let data;

  $: consumable = data.consumable;

  let submitting = false;
  let fiveMinutesInMs = 5 * 60 * 1000;
</script>

<div class="container mx-auto p-2">
  {#if !consumable}
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <div class="stat">
          <div class="stat-title">{m.events_scan_status()}</div>
          <div class="stat-value text-lg">
            <span class="text-error">{m.events_ticket_not_found()}</span>
          </div>
          <div class="stat-desc">{m.events_ticket_not_found_description()}</div>
        </div>
        <div class="card-actions mt-4">
          <a class="btn btn-primary" href=".">{m.events_open_qr_scanner()}</a>
        </div>
      </div>
    </div>
  {:else}
    {@const shoppable = consumable.shoppable}
    {@const member = consumable.member}
    {@const questionResponses = consumable.questionResponses || []}
    {@const hasQuestionResponses = questionResponses.length > 0}
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <div>
          <div class="stat-title text-sm">{m.events_scan_ticket()}</div>
          <div class="card-title pt-0">{shoppable.title}</div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="stat">
            <div class="stat-title">{m.events_scan_status()}</div>
            <div class="stat-value text-lg">
              {#if consumable.shoppable.event.slug !== slug}
                <span class="text-error">{m.events_invalid_wrong_event()}</span>
                <br />
                <span class="text-sm font-normal"
                  >{m.events_ticket_not_valid_for_this_event()}</span
                >
              {:else if consumable.consumedAt && Date.now() - consumable.consumedAt.getTime() < fiveMinutesInMs}
                <!-- If the ticket was recently consumed (just after marking as consumed in admin interface) -->
                <span class="text-warning">{m.events_consumed_just_now()}</span>
              {:else if consumable.consumedAt}
                <span class="text-error"
                  >{m.events_invalid_already_consumed()}</span
                >
              {:else if consumable.purchasedAt}
                <span class="text-success">{m.events_valid_not_consumed()}</span
                >
              {:else}
                <span class="text-error"
                  >{m.events_invalid_not_purchased()}</span
                >
              {/if}
            </div>
            {#if consumable.consumedAt}
              <div class="stat-desc">
                {m.events_consumed_at()}
                {dayjs(consumable.consumedAt).format("YYYY-MM-DD HH:mm")}
              </div>
            {/if}
          </div>

          <div class="stat">
            <div class="stat-title">{m.events_owner()}</div>
            <div class="stat-value text-lg">
              {#if member}
                <div class="flex items-center gap-3">
                  <div class="avatar">
                    <div class="w-6 rounded-full">
                      {#if member.picturePath}
                        <img src={member.picturePath} alt="Profile avatar" />
                      {:else}
                        <span class="i-mdi-account-circle h-6 w-6"></span>
                      {/if}
                    </div>
                  </div>
                  <p>
                    {member.firstName}
                    {member.lastName}
                    <span class="text-stone-500">({member.studentId})</span>
                  </p>
                </div>
              {:else if consumable.externalCustomerEmail}
                {consumable.externalCustomerEmail}
              {:else}
                {m.events_unknown_owner()}
              {/if}
            </div>
          </div>
        </div>

        {#if hasQuestionResponses}
          <div class="divider">{m.events_responses()}</div>
          <div class="space-y-2 rounded-md bg-base-300 p-3">
            {#each questionResponses as response}
              <div class="flex flex-col">
                <span class="font-semibold">{response.question.title}:</span>
                <span class="ml-2">{response.answer}</span>
              </div>
            {/each}
          </div>
        {/if}

        <div class="divider">{m.events_event_details()}</div>
        <div class="space-y-2">
          <div>
            <span class="font-semibold">{m.events_event()}:</span>
            <span>{shoppable.event.title}</span>
          </div>
          <div>
            <span class="font-semibold">{m.events_date()}:</span>
            <span
              >{dayjs(shoppable.event.startDatetime).format(
                "YYYY-MM-DD HH:mm",
              )}</span
            >
          </div>
          <div>
            <span class="font-semibold">{m.events_description()}:</span>
            <span class="line-clamp-3">
              {shoppable.event.description ||
                m.events_no_description_available()}
            </span>
          </div>
        </div>

        <div class="card-actions mt-4 flex justify-end gap-4">
          <a class="btn btn-primary" href=".">{m.events_open_qr_scanner()}</a>
          <form
            method="POST"
            action="?/consume"
            use:enhance={() => {
              submitting = true;
              return async ({ result }) => {
                submitting = false;
                if (result.type === "success") {
                  await invalidateAll();
                }
              };
            }}
          >
            <button
              class="btn btn-secondary"
              disabled={Boolean(consumable.consumedAt) ||
                consumable.shoppable.event.slug !== slug ||
                submitting}
            >
              {#if submitting}
                {m.events_processing()}...
              {:else}
                {m.events_consume_ticket()}
              {/if}
            </button>
          </form>
        </div>
      </div>
    </div>
  {/if}
</div>
