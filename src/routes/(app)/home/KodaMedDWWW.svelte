<script lang="ts">
  import dayjs from "dayjs";
  export let commitCount: string;
  export let commitData: {
    author: string;
    message: string;
    avatarUrl: string;
    date: string;
    url: string;
  };
</script>

<div
  class="rounded-t-xl border-t-4 bg-base-300 p-4 text-2xl font-bold max-lg:border-t-secondary lg:border-t-primary xl:border-t-secondary"
>
  Koda med DWWW!
</div>
<div class="flex flex-col rounded-b-xl bg-base-200 p-4">
  Har du hittat en bug, har en bra idé på en ny feature eller vill lära dig
  webutveckling? Då har du hittat rätt ställe!
  <div class="flex flex-wrap justify-between pt-4">
    <a class="btn btn-ghost btn-sm" href="https://github.com/Dsek-LTH/web"
      ><span
        class="i-mdi-github text-lg max-lg:text-secondary lg:text-primary xl:text-secondary"
      /> Github</a
    >
    <a
      class="btn btn-ghost btn-sm"
      href="https://github.com/Dsek-LTH/web/issues/new"
      ><span
        class="i-mdi-bug text-lg max-lg:text-secondary lg:text-primary xl:text-secondary"
      /> Rapportera en bug</a
    >
    <a
      class="btn btn-ghost btn-sm"
      href="https://github.com/Dsek-LTH/web/commits/main/"
      ><span
        class="i-mdi-history text-lg max-lg:text-secondary lg:text-primary xl:text-secondary"
      />Commits: {commitCount}</a
    >
  </div>
  <a
    href={commitData.url}
    class="m-2 flex flex-col rounded-xl bg-base-300 p-3 hover:bg-base-100 sm:flex-row sm:items-center"
  >
    <div class="flex flex-row items-center">
      <img
        class="mr-2 max-w-8 rounded-2xl"
        src={commitData.avatarUrl}
        alt="latest commiters avatar"
      />
      <span class="font-semibold">{commitData.author}</span>
    </div>
    <span class="ml-2 text-sm">{commitData.message}</span>
    <span class="ml-auto text-right text-sm font-light"
      >{dayjs(commitData.date).fromNow()}</span
    >
  </a>
</div>
