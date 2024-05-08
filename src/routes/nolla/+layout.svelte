<div
  data-theme="nollningPreReveal"
  class="font-nolla-sans flex flex-1 flex-col"
>
  <nav class="container mx-auto flex items-center justify-between py-10">
    <div class="flex gap-24 text-2xl font-semibold">
      <a href="/nolla">Start</a>
      <a href="/nolla/nollning">Nollning?</a>
      <a href="/nolla/sektionen">Sektionen</a>
    </div>

    <button
      class="flex items-center rounded-xl border border-b-4 border-r-4 border-black bg-primary p-4 text-2xl font-semibold transition-all hover:border-b-8 hover:border-r-8"
    >
      <a href="/">dsek.se</a>
      <span class="i-mdi-arrow-right" />
    </button>
  </nav>

  <div class="container mx-auto flex-1">
    <slot />
  </div>
</div>
