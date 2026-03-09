<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import { getFullName, getInitials } from "$lib/utils/client/member";
  import dayjs from "dayjs";

  let {
    position,
    mandates,
    class: klass,
    index,
  }: {
    position: ExtendedPrismaModel<"Position">;
    mandates: Array<
      ExtendedPrismaModel<"Mandate"> & {
        member: ExtendedPrismaModel<"Member">;
      }
    >;
    class: string;
    index?: number;
  } = $props();
</script>

<div
  class={cn(
    "rounded-md border-[1px] p-4",
    klass,
    "animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] duration-300",
  )}
  style="animation-delay:{(index ? index + 1 : 0) * 50}ms"
>
  <a
    href="/positions/{position.id}"
    class="hover:text-muted-foreground transition-all"
    ><h4>{position.name}</h4></a
  >
  <a
    class="text-muted-foreground transition-all hover:opacity-80"
    href="mailto:{position.email}">{position.email}</a
  >
  <p class="mt-1">{position.description}</p>
  <div class="mt-2 flex flex-col gap-1">
    {#each mandates as mandate (mandate.id)}
      <a
        href="/members/{mandate.member.studentId}"
        class="flex flex-row items-center gap-2 p-1 transition-opacity hover:opacity-80 focus:opacity-80"
      >
        <Avatar.Root class="relative">
          <Avatar.Image
            lazy
            src={mandate.member.picturePath}
            alt="Member image"
          />
          <Avatar.Fallback>{getInitials(mandate.member)}</Avatar.Fallback>
        </Avatar.Root>

        <div class="flex flex-col gap-0">
          <h6 class="mb-0 line-clamp-3 leading-4.5 break-words">
            {getFullName(mandate.member)}
          </h6>

          <div>
            <span
              class={dayjs(mandate.startDate).year() == new Date().getFullYear()
                ? ""
                : "italic"}
              >{dayjs(mandate.startDate).format("YYYY-MM-DD")}</span
            >
            -
            <span
              class={dayjs(mandate.endDate).year() == new Date().getFullYear()
                ? ""
                : "italic"}>{dayjs(mandate.endDate).format("YYYY-MM-DD")}</span
            >
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
