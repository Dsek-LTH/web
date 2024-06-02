<script lang="ts">
  import { type Semester, toString } from "$lib/utils/semesters";
  export let medals: Array<{ medal: string; after: Semester }>;

  let sortedMedals = medals.toSorted((a, b) => a.after - b.after);

  const makeLink = (semester: Semester) => {
    const sp = new URLSearchParams([["semester", toString(semester)]]);
    return "/medals?" + sp;
  };
</script>

<div class="my-2 text-xl font-bold">Medaljer</div>
<ul class="flex flex-col gap-2">
  {#each sortedMedals as medal}
    <a class="hover:underline" href={makeLink(medal.after)}>
      <li
        class="flex items-center justify-between gap-4 rounded-lg bg-base-200 p-3"
      >
        <div class="flex flex-col">
          <span class="font-semibold">{medal.medal}</span>
        </div>
        <div
          class="flex flex-1 flex-col items-stretch overflow-hidden text-right"
        >
          <div class=" flex flex-col font-bold opacity-50">
            efter {toString(medal.after)}
          </div>
        </div>
      </li>
    </a>
  {/each}
</ul>
