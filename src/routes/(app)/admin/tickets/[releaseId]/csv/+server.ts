import { loadRoster } from "../loadRoster";
import { getFullName } from "$lib/utils/client/member";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// RFC 4180: quote every field, doubling any embedded quotes.
const csvField = (value: string) => `"${value.replaceAll('"', '""')}"`;

// Header values must be Latin-1, so give an ASCII fallback plus the real
// name as RFC 5987 `filename*` for browsers that support it.
const contentDisposition = (filename: string) => {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
};

export const GET = async ({ params, locals, request }) => {
  const { user, prisma } = locals;
  const { release, roster } = await loadRoster(
    prisma,
    user,
    request,
    params.releaseId,
  );

  let csv = "Namn,StilID,Matpreferens,Bekräftad\r\n";
  for (const entry of roster) {
    const name = entry.member
      ? getFullName(entry.member, { hideNickname: true })
      : entry.memberId;
    const foodPreference = entry.member?.foodPreference ?? "";
    csv += [
      csvField(name),
      csvField(entry.memberId),
      csvField(foodPreference),
      csvField(
        dayjs(entry.updatedAt)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DD HH:mm:ss"),
      ),
    ].join(",");
    csv += "\r\n";
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": contentDisposition(`${release.title}.csv`),
    },
  });
};
