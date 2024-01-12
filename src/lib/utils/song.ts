export function fixSongText(s: string): string {
  return s
    .replaceAll("---", "—")
    .replaceAll("--", "–")
    .replaceAll("||:", "𝄆")
    .replaceAll(":||", "𝄇")
    .replaceAll("|:", "𝄆")
    .replaceAll(":|", "𝄇");
}
