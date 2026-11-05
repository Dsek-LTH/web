<script lang="ts">
  import MemberForm from "../MemberForm.svelte";
  import { type PageData } from "./$types";
  import * as m from "$paraglide/messages";

  let { data }: { data: PageData } = $props();
</script>

<div class="layout-container">
  <h6>{m.member_edit_profile()}</h6>
  <MemberForm {data} dialog={false} />
</div>
