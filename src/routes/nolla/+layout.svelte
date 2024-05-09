<script lang="ts">
  import "./styles.css";
</script>

<div
  data-theme="nollningPreReveal"
  class="flex flex-1 flex-col font-nolla-sans"
>
  <nav class="container mx-auto flex h-36 items-center justify-between py-10">
    <div
      class="flex gap-24 text-2xl font-semibold *:bg-gradient-to-r *:from-primary *:to-primary *:bg-[length:0_2px] *:bg-bottom *:bg-no-repeat *:transition-all"
    >
      <a href="/nolla" class="hover:bg-[length:100%_2px]">Start</a>
      <a href="/nolla/nollning" class="hover:bg-[length:100%_2px]">
        Nollning
      </a>
      <a href="/nolla/sektionen" class="hover:bg-[length:100%_2px]">
        Sektionen
      </a>
    </div>

    <a
      href="/"
      class="box-shadow-black translate hover:box-shadow-black-lg flex items-center
             rounded-xl border-2 border-black bg-primary p-4 text-2xl font-semibold
             transition hover:-translate-x-1 hover:-translate-y-1 active:translate-x-1
             active:translate-y-1 active:shadow-none"
    >
      dsek.se
      <span class="i-mdi-arrow-right" />
    </a>
  </nav>

  <div class="container mx-auto flex-1">
    <slot />
  </div>
</div>
