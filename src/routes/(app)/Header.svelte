<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<header class="contents">
  <img
    class="h-full w-full rounded-2xl object-cover md:col-span-2"
    src="./hero-image.jpg"
    alt="Cover"
  />
  <h1 class="text-balance text-5xl font-bold lg:text-6xl">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html m.landing_splash()}
  </h1>
  <div>
    <p class="mb-8">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.landing_info()}
    </p>
    <a
      class="btn btn-primary justify-self-start px-10 font-bold uppercase"
      href="/info/for-foretag"
    >
      {m.landing_forCompanies()}
    </a>
  </div>
</header>
