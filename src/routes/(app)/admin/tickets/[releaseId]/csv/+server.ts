import { loadRoster } from "../loadRoster";
import { getFullName } from "$lib/utils/client/member";
import dayjs from "dayjs";

const csvField = (value: string) => value.replaceAll(",", " ").replaceAll("\n", " ");

export const GET = async ({ params, locals, request }) => {
  const { user, prisma } = locals;
  const { release, roster } = await loadRoster(
    prisma,
    user,
    request,
    params.releaseId,
  );

  let csv = "Namn,StilID,Matpreferens,Bekräftad\n";
  for (const entry of roster) {
    const name = entry.member
      ? getFullName(entry.member, { hideNickname: true })
      : entry.memberId;
    const foodPreference = entry.member?.foodPreference ?? "";
    csv += [
      csvField(name),
      csvField(entry.memberId),
      csvField(foodPreference),
      dayjs(entry.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    ].join(",");
    csv += "\n";
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${csvField(release.title)}.csv"`,
    },
  });
};
