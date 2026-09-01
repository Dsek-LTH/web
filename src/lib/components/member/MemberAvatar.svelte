<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { getInitials, type MemberNames } from "$lib/utils/client/member";

  let {
    member,
    class: klass,
    lazy,
  }: {
    // TEMPORARY dual-shape (Prisma `| null` + Go `| undefined`) - see the
    // comment on MemberNames in $lib/utils/client/member.ts for why and
    // when to narrow this back to Go-only.
    member: MemberNames & { picturePath?: string | null | undefined };
    class?: string;
    lazy?: boolean;
  } = $props();
</script>

<Avatar.Root class={klass}>
  <Avatar.Image {lazy} src={member?.picturePath} alt="Member image" />
  <Avatar.Fallback class="text-xs">{getInitials(member)}</Avatar.Fallback>
</Avatar.Root>
