<script lang="ts">
  import MemberCard from "$lib/components/MemberCard.svelte";
  import {
    buttonVariants,
    type ButtonVariant,
  } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    members,
    class: klass,
    children,
    title,
    variant = "rosa",
  }: {
    // Loosened to MemberCard's own dual-shape (Prisma `| null` vs Go API
    // `| undefined`) - see MemberCard.svelte's identical comment. Narrow
    // to `string | undefined` once every consumer of this component is
    // Go-backed.
    members: Array<
      { id: string } & {
        [K in
          | "firstName"
          | "lastName"
          | "nickname"
          | "studentId"
          | "picturePath"
          | "classProgramme"
          | "classYear"]?: ExtendedPrismaModel<"Member">[K] | undefined;
      }
    >;
    class?: string;
    children?: Snippet;
    title?: string;
    variant?: ButtonVariant;
  } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={cn(klass, buttonVariants({ variant: variant }))}
    >{@render children?.()}</Dialog.Trigger
  >

  <Dialog.Content>
    {#if title}
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
    {/if}
    <div class="mb-4 ml-4 flex flex-col gap-2">
      {#each members as member (member.id)}
        <MemberCard class="border-0 p-0" {member} />
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>
