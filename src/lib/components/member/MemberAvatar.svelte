<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { MemberNames } from "$lib/utils/client/member";
  import { getInitials } from "$lib/utils/client/member";

  const {
    member,
    class: klass,
  }: {
    member: (MemberNames & { picturePath: string | null }) | undefined;
    class?: string;
  } = $props();
</script>

<Avatar.Root class={klass}>
  <Avatar.Image src={member?.picturePath} alt="profile picture" />
  <Avatar.Fallback>{getInitials(member)}</Avatar.Fallback>
</Avatar.Root>
