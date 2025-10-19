<script lang="ts">
  import * as m from "$paraglide/messages";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageProps } from "./$types";
  let { data }: PageProps = $props();

  let isEditing = $state(false);

  /*$: meetings = Object.keys(data.meetings).sort((a, b) =>
    type === "board-meeting" || type === "SRD-meeting"
      ? b.localeCompare(a, "sv")
      : a.localeCompare(b, "sv"),
  );
  $: canCreate = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    data.user,
  );
  $: canEdit = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
    data.user,
  );*/

  let canEdit,
    canCreate = true;
</script>

<SetPageTitle title={m.documents()} />

<div class="flex flex-row flex-wrap justify-between">
  {#if canCreate || canEdit}
    <div class="mb-4 flex flex-row gap-1">
      {#if canCreate}
        <a class="btn btn-primary btn-sm" href="/documents/upload"
          >{m.documents_uploadFile()}</a
        >
      {/if}
      {#if canEdit}
        <button
          class="btn btn-secondary btn-sm"
          onclick={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? m.documents_stopEditing() : m.documents_edit()}
        </button>
      {/if}
    </div>
  {/if}
</div>

<div class="flex flex-col gap-4">
  <div
    class="grid grid-cols-1 items-stretch justify-items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    {#each data.albums as album (album)}
      <a href={"./gallery/album/" + album[0]}
        ><div class="card bg-base-300 shadow-sm">
          <figure class="relative">
            <div
              class="bg-base-300 transition-all absolute flex group-hover:opacity-100 md:opacity-0 hover:bg-opacity-70 flex-col items-center justify-center inset-0 opacity-0 hover:opacity-100"
            >
              <span
                class="link font-bold text-lg hover:opacity-100 text-neutral-content"
                >Visa bilder...</span
              >
            </div>
            <img src={album[1][0]?.thumbnailUrl} alt="to display" />
          </figure>
          <div class="card-body pt-5">
            <h2 class="card-title text-2xl">{album[0].split(/ (.*)/s)[1]}</h2>
            <div class="flex flex-row space-between">
              <p>{album[0].split(" ")[0]}</p>
              <p class="text-right">{album[1].length} bilder</p>
            </div>
          </div>
        </div>
      </a>
      <!--<Album
      name={album}
      files={data.albums[album] ?? []}
      {isEditing}
      deleteForm={data.deleteForm}
    />-->
    {/each}
  </div>
</div>
