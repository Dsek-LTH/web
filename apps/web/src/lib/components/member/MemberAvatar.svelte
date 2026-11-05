<script lang="ts">
  import type { components } from "$lib/api/schema";
  import * as Avatar from "$lib/components/ui/avatar";
  import { getInitials, type MemberNames } from "$lib/utils/client/member";

  let {
    member,
    class: klass,
    lazy,
  }: {
    member: MemberNames & Pick<components["schemas"]["Member"], "picturePath">;
    class?: string;
    lazy?: boolean;
  } = $props();
</script>

<Avatar.Root class={klass}>
  <Avatar.Image {lazy} src={member?.picturePath} alt="Member image" />
  <Avatar.Fallback class="text-xs">{getInitials(member)}</Avatar.Fallback>
</Avatar.Root>
