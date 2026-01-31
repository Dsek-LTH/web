<script lang="ts">
  import MemberForm from "../MemberForm.svelte";
  import { type PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="layout-container">
  <MemberForm {data} dialog={false} />
</div>
