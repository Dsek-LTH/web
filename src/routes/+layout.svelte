<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import "@stripe/stripe-js"; /* Recommended for fraud detection */
  import "../app.css";
</script>

<a
  class="btn btn-circle btn-primary fixed bottom-4 right-4 z-20"
  href="https://forms.gle/skDsfLGyQHuCYGcR7"
  target="_blank"
>
  <span class="i-mdi-feedback" />
</a>

<ParaglideJS {i18n}>
  <slot />
</ParaglideJS>
