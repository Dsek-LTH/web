<script lang="ts">
  import { getFullName } from "$lib/utils/client/member";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import ClassBadge from "../ClassBadge.svelte";
  export let member: MemberSearchReturnAttributes;
</script>

<li>
  <a
    href={"/members/" + member.studentId}
    class="border border-transparent focus:border-primary"
  >
    <MemberAvatar class="h-8 w-8" {member} />
    <h4>{getFullName(member)}</h4>
    <ClassBadge {member} />
    <p class="text-primary">({member.studentId})</p>
  </a>
</li>
