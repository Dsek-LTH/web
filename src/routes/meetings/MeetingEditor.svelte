<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import {
    MEETING_TYPE,
    TODAY_AT_17_15,
    type MeetingSchema,
    TODAY_AT_23_00,
    NEXT_TUESDAY_AT_12_15,
    NEXT_TUESDAY_AT_13_00,
  } from "./schemas";

  export let data: SuperValidated<MeetingSchema>;
  const { form, errors, constraints, enhance } = superForm(data);
  export let action: string;
</script>

<form method="POST" use:enhance class="form-control gap-4" {action}>
  <Input
    name="title"
    label="Titel"
    bind:value={$form.title}
    errors={$errors.title}
    {...$constraints.title}
  />
  <Input
    name="description"
    label="Beskrivning (valfritt)"
    bind:value={$form.description}
    errors={$errors.description}
    {...$constraints.description}
  />
  <div class="flex flex-col md:join md:flex-row [&>*]:flex-1">
    <Labeled id="type" label="Mötestyp" error={$errors.type}>
      <select
        id="type"
        name="type"
        bind:value={$form.type}
        {...$constraints.type}
        on:change={(e) => {
          if (e.currentTarget.value === MEETING_TYPE.GuildMeeting) {
            form.update((f) => {
              f.start = TODAY_AT_17_15;
              f.end = TODAY_AT_23_00;
              return f;
            });
          } else if (e.currentTarget.value === MEETING_TYPE.BoardMeeting) {
            form.update((f) => {
              f.start = NEXT_TUESDAY_AT_12_15;
              f.end = NEXT_TUESDAY_AT_13_00;
              return f;
            });
          }
        }}
        class="select select-bordered md:rounded-r-none"
      >
        <option value={MEETING_TYPE.GuildMeeting}>Sektionsmöte</option>
        <option value={MEETING_TYPE.BoardMeeting}>Styrelsemöte</option>
        <option value={MEETING_TYPE.Other}>Annat</option>
      </select>
    </Labeled>
    <Labeled id="start" label="Start" error={$errors.start}>
      <input
        id="start"
        type="datetime-local"
        name="start"
        value={$form.start.toLocaleString("sv").split(" ").join("T").slice(0, 16)}
        {...$constraints.start}
        class="input join-item input-bordered"
      />
    </Labeled>
    <Labeled id="end" label="Slut" error={$errors.end}>
      <input
        id="end"
        type="datetime-local"
        name="end"
        value={$form.end.toLocaleString("sv").split(" ").join("T").slice(0, 16)}
        {...$constraints.end}
        class="input join-item input-bordered"
      />
    </Labeled>
  </div>
  <slot />
</form>
