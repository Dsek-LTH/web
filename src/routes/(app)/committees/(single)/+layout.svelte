<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import type { Snippet } from "svelte";
  import type { CommitteeLoadData } from "./committee.server";

  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Pen from "@lucide/svelte/icons/pen";

  import { buttonVariants } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import EditDetailForm from "./EditDetailForm.svelte";

  import * as m from "$paraglide/messages";
  import LinksDialog from "./LinksDialog.svelte";
  import { marked } from "marked";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { page } from "$app/state";

  let { data, children }: { data: CommitteeLoadData; children: Snippet } =
    $props();

  let canEdit = $state(isAuthorized(apiNames.COMMITTEE.UPDATE, page.data.user));

  let committee = $derived(data.committee);
</script>

<div class="sm:layout-container sm:py-0">
  <div class="border-x-[1px] border-t-[1px] border-b-[1px] p-2 sm:border-t-0">
    <header
      style="background-image: url({committee.bannerUrl});"
      class="bg-rosa-300 relative h-60 rounded-md bg-cover bg-center"
    >
      <div
        class="absolute bottom-1 left-4 flex flex-col sm:bottom-4 sm:flex-row sm:gap-4"
      >
        <CommitteeIcon
          override={committee.isBannerTextLight ? "light" : "dark"}
          class="size-16"
          {committee}
        />
        <h1
          class={cn(
            committee.isBannerTextLight ? "text-white" : "text-black",
            "text-3xl sm:text-[48px]",
          )}
        >
          {committee.name}
        </h1>
      </div>
      {#if canEdit}
        <Dialog.Root>
          <Dialog.Trigger
            class={cn(
              "absolute top-4 right-4",
              buttonVariants({ size: "icon-sm", variant: "outline" }),
            )}><Pen /></Dialog.Trigger
          >

          <Dialog.Content
            class="z-51 max-h-[80vh] overflow-y-scroll sm:max-w-[425px]"
          >
            <EditDetailForm {data} />
          </Dialog.Content>
        </Dialog.Root>
      {/if}
    </header>
  </div>
  <div class="flex flex-col sm:flex-row">
    <aside
      class="bg-muted-background flex flex-col gap-4 border-r-[1px] border-b-[1px] border-l-[1px] p-8 sm:w-64 sm:border-r-0 sm:border-b-0"
    >
      <a class="flex flex-row items-center gap-1 font-medium" href="/committees"
        ><ArrowLeft class="size-4" />{m.back()}</a
      >
      <div
        class="[&_a]:text-muted-foreground [&_a]:hover:text-foreground flex flex-col gap-1 [&_a]:transition-all [&_strong]:font-medium"
      >
        <span class="font-medium">{committee.name}</span>
        <a href="/committees/{committee.shortName}">{m.committees_about()}</a>
        <a href="/committees/{committee.shortName}/members"
          >{m.committees_members()}</a
        >
        <a href="/committees/{committee.shortName}/news"
          >{m.committees_news()}</a
        >
        <span>&nbsp;</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags Already sanitized -->
        {@html marked.parseInline(data.links?.markdown ?? "")}
      </div>
      {#if canEdit}
        <LinksDialog {data} />
      {/if}
    </aside>
    <main class="w-full border-x-[1px] p-8">
      {@render children?.()}
    </main>
  </div>
</div>
