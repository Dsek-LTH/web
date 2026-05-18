<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import * as Avatar from "$lib/components/ui/avatar";

  let { data }: { data: PageData } = $props();
</script>

<SetPageTitle title={m.theBoard()} />

<div class="layout-container">
  <div class="flex flex-row items-center justify-between">
    <div class="hidden w-4/12 rounded-lg md:block">
      <div class="bg-muted-background rounded-lg border-[1px] shadow-xl">
        <img
          class="rounded-lg"
          src="https://files.dsek.se/files/public/photos/styr26.jpg"
          alt="guild"
        />
      </div>
    </div>
    <div class="pl-8 md:w-8/12">
      <h1>{m.theBoard()}</h1>

      <p>{m.board_prose()}</p>

      <div class="mt-4 flex flex-row gap-2">
        <Button disabled size="sm" variant="rosa"
          ><Pen /> Läs verksamhetsplanen <ArrowRight /></Button
        >
        <Button disabled size="sm" variant="lila"
          ><Pen /> Styrelsens likabehandlingsplan <ArrowRight /></Button
        >
      </div>
    </div>
  </div>
  <h2 class="mt-12 mb-4">Styrelsemedlemmar</h2>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
    {#each data.boardPositions as boardMember (boardMember.position.id)}
      <div
        class="bg-muted-background flex flex-col items-center rounded-md border-[1px] p-4 py-6 text-center"
      >
        {#if boardMember.studentId}
          <a
            href="/members/{boardMember.studentId}"
            class="flex flex-col items-center"
          >
            <MemberAvatar member={boardMember} class="size-24" />
            <h4 class="mt-1.5">
              {getFullName(boardMember)}
            </h4>
          </a>
          <a
            class="mt-1 hover:underline"
            href="/positions/{boardMember.position.id}"
            ><h6>
              {boardMember.position.name}
            </h6></a
          >
          <p class="mt-2 text-left">
            {boardMember.position.description}
          </p>
          <a
            class="link mt-auto self-start pt-1 text-left"
            href="mailto:{boardMember.position.email}"
          >
            {boardMember.position.email}
          </a>
        {:else}
          <div class="flex flex-col items-center">
            <Avatar.Root class="size-24">
              <Avatar.Fallback class="text-xs"></Avatar.Fallback>
            </Avatar.Root>
            <h4 class="mt-1.5">
              {m.vacant()}
            </h4>
          </div>
          <a
            class="mt-1 hover:underline"
            href="/positions/{boardMember.position.id}"
            ><h6>
              {boardMember.position.name}
            </h6></a
          >
          <p class="mt-2 text-left">
            {boardMember.position.description}
          </p>
          <a
            class="link mt-auto self-start pt-1 text-left"
            href="mailto:{boardMember.position.email}"
          >
            {boardMember.position.email}
          </a>
        {/if}
      </div>
    {/each}
  </section>
</div>
