<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import MemberSearch from "$lib/components/MemberSearch.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";
  export let author: Member;
  export let value: string = "";
  export let error: string | undefined = undefined;
  let handleSearch: (searchValue: string) => void;
  let indexOfTagStart = -1;
  let inputEl: HTMLInputElement;
</script>

<div class="flex items-end gap-4">
  <MemberAvatar member={author} class="w-12 rounded-lg" />
  <div class="flex flex-1 flex-col">
    <label class="label w-auto self-start" for="comment">
      <span class="label-text">Kommentera</span>
    </label>
    <form class="join join-horizontal w-full" method="POST" action="?/comment" use:enhance>
      <MemberSearch
        bind:handleSearch
        class="dropdown-top flex-1"
        onSelect={(selectedMember) => {
          value = `${value.substring(0, indexOfTagStart)}[@${getFullName(
            $page.data.session?.user,
            selectedMember
          )}](/members/${selectedMember.studentId}) `;
          inputEl.focus();
        }}
      >
        <input
          bind:this={inputEl}
          autocomplete="off"
          id="comment"
          name="content"
          type="text"
          class="input join-item input-bordered w-full"
          placeholder="Kommentera något kul..."
          bind:value
          on:keypress={(e) => {
            // on @ -> start tagging
            if (e.key === "@") {
              indexOfTagStart = e.currentTarget.selectionStart ?? -1;
              // on escape -> stop tagging
            } else if (e.key === "Escape") {
              indexOfTagStart = -1;
            }
          }}
          on:input={(e) => {
            if (indexOfTagStart === -1) return;
            const currentComment = e.currentTarget.value;
            if (currentComment.lastIndexOf("@") !== indexOfTagStart) {
              indexOfTagStart = -1;
              handleSearch("");
              return;
            }
            const searchValue = currentComment.substring(indexOfTagStart + 1);
            handleSearch(searchValue);
          }}
        />
      </MemberSearch>
      <button type="submit" class="btn btn-primary join-item">Skicka</button>
    </form>
  </div>
  {#if error}
    <p class="text-error">{error}</p>
  {/if}
</div>
