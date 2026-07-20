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
    members: Array<ExtendedPrismaModel<"Member">>;
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
