<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar/index.js";
  import { getFileUrl } from "$lib/files/client";
  import { debounce } from "$lib/utils/debounce";

  let {
    value = $bindable(""),
    id,
    placeholder,
    invalid = false,
    errorMessage = "",
    onblur,
  }: {
    value?: string;
    id?: string;
    placeholder?: string;
    invalid?: boolean;
    errorMessage?: string;
    onblur?: () => void;
  } = $props();

  type Member = {
    firstName?: string;
    lastName?: string;
    nickname?: string;
    studentId?: string;
    picturePath?: string | null;
  };

  let results = $state<Member[]>([]);
  let open = $state(false);

  const search = debounce(async (query: string) => {
    if (!query) {
      results = [];
      open = false;
      return;
    }
    const url = new URL("/api/members", window.location.origin);
    url.searchParams.set("search", query);
    try {
      const response = await fetch(url);
      results = response.ok ? (await response.json()).slice(0, 6) : [];
    } catch {
      results = [];
    }
    open = results.length > 0;
  }, 200);

  function displayName(member: Member): string {
    return (
      [member.firstName, member.lastName].filter(Boolean).join(" ") ||
      member.nickname ||
      ""
    );
  }

  function initials(member: Member): string {
    return (
      `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() ||
      "?"
    );
  }

  function pick(member: Member) {
    value = displayName(member);
    results = [];
    open = false;
  }
</script>

<div class="relative">
  <Input
    {id}
    {placeholder}
    bind:value
    autocomplete="off"
    aria-invalid={invalid}
    aria-errormessage={errorMessage}
    oninput={() => search(value)}
    onfocus={() => {
      if (results.length) open = true;
    }}
    onblur={() => {
      setTimeout(() => (open = false), 150);
      onblur?.();
    }}
  />
  {#if open}
    <ul
      class="bg-popover border-border absolute z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md"
    >
      {#each results as member (member.studentId)}
        <li>
          <button
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            onmousedown={(e) => {
              e.preventDefault();
              pick(member);
            }}
          >
            <Avatar class="size-6">
              <AvatarImage src={getFileUrl(member.picturePath)} alt="" />
              <AvatarFallback class="text-[10px]"
                >{initials(member)}</AvatarFallback
              >
            </Avatar>
            {displayName(member)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
