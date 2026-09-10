<script lang="ts">
  type Entry =
    | { kind: "term"; label: string }
    | { kind: "month"; label: string; desc: string };

  let {
    terms,
  }: {
    terms: ReadonlyArray<{
      term: string;
      months: ReadonlyArray<{ name: string; desc: string }>;
    }>;
  } = $props();

  // Flatten so the rail runs unbroken through both terms.
  let entries = $derived<Entry[]>(
    terms.flatMap((t) => [
      { kind: "term" as const, label: t.term },
      ...t.months.map((mo) => ({
        kind: "month" as const,
        label: mo.name,
        desc: mo.desc,
      })),
    ]),
  );
</script>

<ol class="relative flex flex-col">
  <!-- rail: left-aligned on mobile, centered from md up -->
  <span
    class="bg-border absolute top-3 bottom-3 left-[9px] w-px md:left-1/2 md:-translate-x-1/2"
    aria-hidden="true"
  ></span>

  {#each entries as entry, index (entry.kind + entry.label)}
    {#if entry.kind === "term"}
      <li class="relative flex py-5 pl-10 md:justify-center md:pl-0">
        <span
          class="border-primary/40 bg-background text-primary rounded-full border px-4 py-1 text-xs font-bold tracking-widest uppercase"
        >
          {entry.label}
        </span>
      </li>
    {:else}
      {@const right = index % 2 === 0}
      <li
        class="animate-in fade-in slide-in-from-bottom-[0.75rem] fill-mode-backwards relative pb-6 pl-10 duration-300 md:grid md:grid-cols-2 md:gap-x-12 md:pl-0"
        style="animation-delay:{index * 60}ms"
      >
        <span
          class="bg-primary ring-background absolute top-4 left-[3px] size-3.5 rounded-full ring-4 md:left-1/2 md:-translate-x-1/2"
          aria-hidden="true"
        ></span>

        <div
          class="border-border/80 bg-card flex flex-col gap-1.5 rounded-xl border p-5 shadow-xs {right
            ? 'md:col-start-2'
            : 'md:col-start-1 md:text-right'}"
        >
          <h5 class="text-primary text-xs font-bold tracking-wider uppercase">
            {entry.label}
          </h5>
          <p class="text-muted-foreground text-sm leading-relaxed">
            {entry.desc}
          </p>
        </div>
      </li>
    {/if}
  {/each}
</ol>
