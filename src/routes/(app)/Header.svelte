<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<div
  class="hero -mt-16 min-h-screen lg:justify-start"
  style="background-image: url(./hero-image.webp);"
>
  <div class="hero-content text-neutral-content">
    <div
      class="max-w-lg rounded-xl bg-base-300 bg-opacity-60 p-8 filter backdrop-blur lg:max-w-xl"
    >
      <h1 class="mb-5 text-balance text-5xl font-bold text-base-content">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.home_splash()}
      </h1>
      <p class="mb-5 text-base-content">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.home_info()}
      </p>
      <a class="btn btn-primary font-bold uppercase" href="/info/for-foretag">
        {m.home_forCompanies()}
      </a>
      <a
        class="shiny-button btn btn-outline btn-primary ml-4 font-bold uppercase shadow-primary outline outline-primary/10 transition-all"
        href="/nolla"
      >
        {m.home_nolla()}
      </a>
    </div>
  </div>
</div>
<div class="-mt-20 h-20 bg-gradient-to-t from-base-100 to-transparent" />

<style>
  @keyframes pulseOutline {
    from {
      outline-offset: 0px;
      outline-color: var(--fallback-p, oklch(var(--p)));
    }
    to {
      outline-offset: 10px;
      outline-color: var(--fallback-p, oklch(var(--p) / 0));
    }
  }

  .shiny-button {
    outline-style: double;
    animation: pulseOutline 1s linear infinite;
  }

  .shiny-button:hover {
    animation-direction: reverse;
  }
</style>
