<div
  data-theme="nollningPreReveal"
  class="flex flex-1 flex-col font-nolla-sans"
>
  <nav class="container mx-auto flex h-36 items-center justify-between py-10">
    <div class="flex gap-24 text-2xl font-semibold">
      <a href="/nolla">Start</a>
      <a href="/nolla/nollning">Nollning?</a>
      <a href="/nolla/sektionen">Sektionen</a>
    </div>

    <button
      class="box-shadow-bottom translate flex items-center rounded-xl border-2 border-black bg-primary p-4 text-2xl font-semibold transition hover:translate-y-2 hover:shadow-none"
    >
      <a href="/">dsek.se</a>
      <span class="i-mdi-arrow-right" />
    </button>
  </nav>

  <div class="container mx-auto flex-1">
    <slot />
  </div>
</div>
