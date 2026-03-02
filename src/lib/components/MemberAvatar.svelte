<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { getInitials } from "$lib/utils/client/member";
  const {
    member,
  }: {
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "lastName" | "picturePath"
    >;
  } = $props();
</script>

<Avatar.Root>
  <Avatar.Image src={member?.picturePath} alt="profile picture" />
  <Avatar.Fallback>{getInitials(member)}</Avatar.Fallback>
</Avatar.Root>
