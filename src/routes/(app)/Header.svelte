<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<div
  class="hero -mt-16 min-h-screen lg:justify-start"
  style="background-image: url(./hero-image.jpg);"
>
  <div class="hero-content text-neutral-content">
    <div
      class="max-w-lg rounded-xl bg-base-300 bg-opacity-60 p-8 filter backdrop-blur lg:max-w-xl"
    >
      <h1 class="mb-5 text-balance text-5xl font-bold text-base-content">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.landing_splash()}
      </h1>
      <p class="mb-5 text-base-content">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.landing_info()}
      </p>
      <a class="btn btn-primary font-bold uppercase" href="/info/for-foretag">
        {m.landing_forCompanies()}
      </a>
    </div>
  </div>
</div>
<div class="-mt-20 h-20 bg-gradient-to-t from-base-100 to-transparent" />
