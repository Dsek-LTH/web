<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<a
  class="flex cursor-pointer gap-6 bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
  href="https://bit.ly/kontaktatrivsel"
>
  <span class="i-mdi-speak self-center text-2xl" />

  <article>
    <p>{m.landing_feedback()}</p>
    <h2 class="text-xl font-bold">{m.landing_contactWellbeing()}</h2>
  </article>
</a>
