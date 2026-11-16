<script lang="ts">
  import Cake from "@lucide/svelte/icons/cake";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import { m } from "$paraglide/messages";

  type BirthdayMember = {
    id: string;
    studentId: string | null;
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    picturePath: string | null;
  };

  let { birthdays }: { birthdays: BirthdayMember[] } = $props();
</script>

{#if birthdays.length > 0}
  <section
    class="border-rosa-200/80 from-rosa-100/80 via-background to-lila-100/80 dark:border-rosa-900/60 dark:from-rosa-950/30 dark:via-background dark:to-lila-950/30 relative overflow-hidden rounded-md border-[1px] bg-linear-to-r p-4"
  >
    <div
      class="bg-rosa-400/15 pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl"
      aria-hidden="true"
    ></div>
    <div
      class="bg-lila-400/15 pointer-events-none absolute -bottom-12 -left-10 size-36 rounded-full blur-2xl"
      aria-hidden="true"
    ></div>
    <div class="relative">
      <h2 class="flex items-center gap-2 text-xl">
        <span
          class="birthday-cake bg-rosa-400/15 inline-flex rounded-full p-1.5"
        >
          <Cake class="text-rosa-500 size-5" />
        </span>
        {m.home_birthdaysToday()}
      </h2>
      <ul class="mt-3 flex list-none flex-wrap gap-2 pl-0">
        {#each birthdays as birthday (birthday.id)}
          {@const href = birthday.studentId
            ? `/members/${birthday.studentId}`
            : "/members"}
          <li>
            <a
              {href}
              class="border-rosa-200/80 bg-background/80 hover:border-rosa-400 hover:bg-rosa-50 dark:border-rosa-800/80 dark:hover:border-rosa-600 dark:hover:bg-rosa-950/40 group relative flex items-center gap-2 rounded-full border-[1px] py-1 pr-3 pl-1 shadow-sm transition-colors"
            >
              <MemberAvatar
                member={birthday}
                class="ring-rosa-200 dark:ring-rosa-800 size-7 ring-2"
              />
              <span class="font-medium">{getFullName(birthday)}</span>
              <span
                class="pointer-events-none absolute -top-2 -right-1.5"
                aria-hidden="true"
              >
                <Sparkles
                  class="text-rosa-400 size-3.5 opacity-0 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100"
                />
                <Sparkles
                  class="text-lila-400 absolute -top-2 -left-3 size-2.5 opacity-0 transition-all delay-75 duration-200 group-hover:-translate-y-1 group-hover:opacity-100"
                />
                <Sparkles
                  class="text-rosa-300 absolute top-2 -right-2 size-2 opacity-0 transition-all delay-150 duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                />
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}

<style>
  .birthday-cake {
    transform-origin: 50% 80%;
    animation: birthday-cake 3.2s ease-in-out infinite;
  }

  @keyframes birthday-cake {
    0%,
    100% {
      transform: rotate(0);
    }
    20% {
      transform: rotate(-8deg);
    }
    40% {
      transform: rotate(8deg);
    }
    60% {
      transform: rotate(-4deg);
    }
    80% {
      transform: rotate(4deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .birthday-cake {
      animation: none;
    }
  }
</style>
