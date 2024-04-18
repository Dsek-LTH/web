<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import "@stripe/stripe-js"; /* Recommended for fraud detection */
  import "../app.css";
</script>

<ParaglideJS {i18n}>
  <slot />
</ParaglideJS>
