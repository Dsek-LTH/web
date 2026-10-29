<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Popover from "$lib/components/ui/popover";
  import { Textarea } from "$lib/components/ui/textarea";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { debounce } from "$lib/utils/debounce";
  import { getFullName } from "$lib/utils/client/member";
  import { superForm, toastFormMessage } from "$lib/utils/client/superForms";
  import { getMentionText } from "$lib/utils/client/commentTagging";
  import type { CommentSchema } from "$lib/zod/comments";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";
  import { tick } from "svelte";
  import type { MentionRequest } from "./types";

  let {
    author,
    commentForm,
    mentionRequest = null,
  }: {
    author: ExtendedPrismaModel<"Member">;
    commentForm: SuperValidated<CommentSchema>;
    mentionRequest?: MentionRequest | null;
  } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, constraints, enhance, delayed } = superForm(
    commentForm,
    {
      resetForm: true,
      invalidateAll: true,
      onResult: ({ result }) => toastFormMessage(result),
    },
  );

  let textarea: HTMLTextAreaElement | null = $state(null);
  let popoverContent: HTMLElement | null = $state(null);
  let mentionOpen = $state(false);
  let mentionQuery = $state("");
  let mentionStart: number | null = $state(null);
  let results: MemberSearchReturnAttributes[] = $state([]);
  let isSearching = $state(false);
  let activeIndex = $state(0);
  let lastMentionRequestId: number | null = $state(null);

  const searchMembers = debounce(async (query: string) => {
    if (!query.trim()) {
      results = [];
      isSearching = false;
      return;
    }
    isSearching = true;
    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("query", query);
      url.searchParams.set("indexes", JSON.stringify(["members"]));
      url.searchParams.set("limit", "8");
      url.searchParams.set("offset", "0");
      const response = await fetch(url);
      if (!response.ok) {
        results = [];
        return;
      }
      const found = (await response.json()) as Array<{
        type: string;
        data: MemberSearchReturnAttributes;
      }>;
      results = found
        .filter((result) => result.type === "members")
        .map((result) => result.data);
      activeIndex = 0;
    } catch {
      results = [];
    } finally {
      isSearching = false;
    }
  }, 150);

  function closeMention() {
    mentionOpen = false;
    mentionStart = null;
    mentionQuery = "";
    results = [];
    searchMembers.cancel();
  }

  function updateMentionState(element: HTMLTextAreaElement) {
    const caret = element.selectionStart ?? 0;
    const value = element.value;

    if (mentionStart !== null) {
      const query = value.slice(mentionStart + 1, caret);
      if (caret <= mentionStart || /[\s\n]/.test(query)) {
        closeMention();
        return;
      }
      mentionQuery = query;
      mentionOpen = true;
      searchMembers(query);
      return;
    }

    const beforeCaret = value.slice(0, caret);
    const match = beforeCaret.match(/(^|\s)@([^\s@]*)$/);
    if (!match) return;

    const query = match[2] ?? "";
    mentionStart = caret - query.length - 1;
    mentionQuery = query;
    mentionOpen = true;
    activeIndex = 0;
    searchMembers(query);
  }

  function selectMember(member: MemberSearchReturnAttributes) {
    const element = textarea;
    if (!element || mentionStart === null) return;

    const caret = element.selectionStart ?? element.value.length;
    const mention = getMentionText(member);
    const content = `${element.value.slice(0, mentionStart)}${mention}${element.value.slice(caret)}`;

    form.update((current) => {
      current.content = content;
      return current;
    });

    const nextCaret = mentionStart + mention.length;
    closeMention();
    void tick().then(() => {
      element.focus();
      element.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleInput(event: Event) {
    updateMentionState(event.currentTarget as HTMLTextAreaElement);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!mentionOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMention();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      activeIndex = (activeIndex + direction + results.length) % results.length;
      return;
    }

    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      const member = results[activeIndex];
      if (member) selectMember(member);
    }
  }

  $effect(() => {
    const request = mentionRequest;
    if (!request || request.id === lastMentionRequestId) return;
    lastMentionRequestId = request.id;

    const mention = getMentionText(request.member);
    form.update((current) => {
      const content = current.content ?? "";
      current.content =
        content.trim().length === 0 || content.trim().startsWith("[@")
          ? mention
          : `${mention}${content}`;
      return current;
    });

    void tick().then(() => {
      textarea?.focus();
      const end = textarea?.value.length ?? 0;
      textarea?.setSelectionRange(end, end);
    });
  });
</script>

<form
  method="POST"
  action="?/comment"
  use:enhance
  class="flex flex-col gap-2"
  onsubmit={closeMention}
>
  <div class="flex gap-3">
    <MemberAvatar member={author} class="shrink-0" />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <Textarea
        bind:ref={textarea}
        id="comment-content"
        name="content"
        rows={3}
        placeholder={m.comments_placeholder()}
        bind:value={$form.content}
        aria-invalid={!!$errors.content}
        aria-errormessage={$errors.content?.at(0)}
        {...$constraints.content}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onblur={() => searchMembers.cancel()}
      />
      {#if $errors.content}
        <p class="text-destructive text-sm">{$errors.content.at(0)}</p>
      {/if}
      <div class="flex flex-row items-center justify-between gap-2">
        <p class="text-muted-foreground text-xs">
          {m.comments_mentionHint()}
        </p>
        <Button type="submit" disabled={$delayed}>
          {$delayed ? m.comments_sending() : m.comments_send()}
        </Button>
      </div>
    </div>
  </div>
</form>

<Popover.Root bind:open={mentionOpen}>
  <Popover.Content
    bind:ref={popoverContent}
    customAnchor={textarea}
    class="w-80 p-0"
    align="start"
    sideOffset={4}
    trapFocus={false}
    onOpenAutoFocus={(event) => event.preventDefault()}
    onCloseAutoFocus={(event) => event.preventDefault()}
    onInteractOutside={(event) => {
      if (
        event.target instanceof Node &&
        (textarea?.parentElement?.contains(event.target) ||
          popoverContent?.contains(event.target))
      ) {
        event.preventDefault();
      }
    }}
  >
    <div role="listbox" aria-label={m.comments_mentionMembers()} class="p-1">
      {#if mentionQuery.trim().length === 0}
        <p class="text-muted-foreground p-2 text-sm">
          {m.comments_mentionTypeToSearch()}
        </p>
      {:else if isSearching}
        <p class="text-muted-foreground p-2 text-sm">
          {m.search_searching()}
        </p>
      {:else if results.length === 0}
        <p class="text-muted-foreground p-2 text-sm">
          {m.search_noResults()}
        </p>
      {:else}
        {#each results as member, index (member.studentId)}
          <button
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            class="hover:bg-secondary-hover data-[active=true]:bg-secondary-hover flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
            data-active={index === activeIndex}
            onmousedown={(event) => event.preventDefault()}
            onclick={() => selectMember(member)}
            onmouseenter={() => (activeIndex = index)}
          >
            <MemberAvatar {member} class="size-6 shrink-0" />
            <span class="min-w-0 flex-1 truncate">
              {getFullName(member)}
            </span>
            <span class="text-muted-foreground shrink-0 text-xs">
              {member.studentId}
            </span>
          </button>
        {/each}
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
