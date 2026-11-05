package songs

import "strings"

// FixSongText applies the songbook's typographic replacements - ported
// verbatim (including replacement order, which matters: "---" must run
// before "--", and "||:"/":||" before "|:"/":|" since the longer sequences
// contain the shorter ones as substrings) from
// src/routes/(app)/songbook/helpers.ts's fixSongText. Applied at read time,
// not stored pre-transformed - matches the old app doing this in the load
// function, not on save.
func FixSongText(s string) string {
	s = strings.ReplaceAll(s, "---", "—")
	s = strings.ReplaceAll(s, "--", "–")
	s = strings.ReplaceAll(s, "||:", "𝄆")
	s = strings.ReplaceAll(s, ":||", "𝄇")
	s = strings.ReplaceAll(s, "|:", "𝄆")
	s = strings.ReplaceAll(s, ":|", "𝄇")
	return s
}

// GroupCategories buckets raw category strings into display groups - ported
// verbatim from fixSongText's neighbor, groupCategories, in the same file.
// Grouping key is the category's first word, except a leading "SåS" groups
// by its first two words (e.g. "SåS Fria" and "SåS Killar" both group under
// "SåS Fria"/"SåS Killar" respectively - "SåS" alone if it has no second
// word). The first category seen for a group becomes its display name; if a
// second, different category maps to the same group, the display name
// falls back to the group id itself (a single category name would no
// longer accurately represent the group) - this quirk is replicated
// exactly, not smoothed over.
func GroupCategories(rawCategories []string) map[string]string {
	categoryMap := map[string]string{}
	for _, category := range rawCategories {
		words := strings.Split(category, " ")
		firstWord := words[0]
		if firstWord == "" {
			continue
		}

		groupID := firstWord
		if firstWord == "SåS" {
			end := 2
			if len(words) < 2 {
				end = len(words)
			}
			groupID = strings.Join(words[:end], " ")
		}

		if _, exists := categoryMap[groupID]; exists {
			categoryMap[groupID] = groupID
		} else {
			categoryMap[groupID] = category
		}
	}
	return categoryMap
}
