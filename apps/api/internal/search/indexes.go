package search

import (
	"encoding/base64"
	"regexp"
)

// The Meilisearch index names, unchanged from the old
// src/lib/search/searchTypes.ts so an existing Meilisearch instance keeps
// working across the switch.
const (
	IndexMembers            = "members"
	IndexEvents             = "events"
	IndexArticles           = "articles"
	IndexPositions          = "positions"
	IndexSongs              = "songs"
	IndexCommittees         = "committees"
	IndexGoverningDocuments = "governingDocuments"
	IndexMeetingDocuments   = "meetingDocuments"
)

// Indexes lists every index, in the order the old app declared them.
var Indexes = []string{
	IndexMembers,
	IndexEvents,
	IndexArticles,
	IndexPositions,
	IndexSongs,
	IndexCommittees,
	IndexGoverningDocuments,
	IndexMeetingDocuments,
}

type typoTolerance struct {
	DisableOnAttributes []string       `json:"disableOnAttributes"`
	MinWordSizeForTypos map[string]int `json:"minWordSizeForTypos"`
}

type indexSettings struct {
	SearchableAttributes []string       `json:"searchableAttributes"`
	RankingRules         []string       `json:"rankingRules"`
	SortableAttributes   []string       `json:"sortableAttributes,omitempty"`
	TypoTolerance        *typoTolerance `json:"typoTolerance,omitempty"`
}

// indexDef is one index's settings plus how a query searches it - a port
// of the old searchTypes.ts meilisearchConstants and searchHelpers.ts'
// getFederatedWeight/getSearchableAttributes.
type indexDef struct {
	settings indexSettings
	// weight is the index's federated search weight.
	weight float64
	// searchOn is the attributes a query searches, per locale; "sv" is
	// also the fallback for any other locale.
	searchOn map[string][]string
	// links are attributes never truncated in results, since they're used
	// to build a link or an image URL.
	links []string
}

var defaultRankingRules = []string{"words", "typo", "proximity", "attribute", "exactness"}

func rankingRules(extra ...string) []string {
	return append(append([]string{}, defaultRankingRules...), extra...)
}

func sameForBoth(attrs ...string) map[string][]string {
	return map[string][]string{"sv": attrs, "en": attrs}
}

var indexDefs = map[string]indexDef{
	IndexMembers: {
		settings: indexSettings{
			// Order matters for ranking: earlier attributes weigh more.
			SearchableAttributes: []string{
				"fullName",
				"firstName",
				"lastName",
				"nickname",
				"studentId",
			},
			// Newer members rank higher.
			RankingRules:       rankingRules("classYear:desc"),
			SortableAttributes: []string{"classYear"},
			TypoTolerance: &typoTolerance{
				// Student ids must match exactly.
				DisableOnAttributes: []string{"studentId"},
				// Defaults are 5 and 9; lowered so "Maja" matches "Maya"
				// and "Erik" matches "Eric".
				MinWordSizeForTypos: map[string]int{"oneTypo": 4, "twoTypos": 6},
			},
		},
		weight:   1.5,
		searchOn: sameForBoth("fullName", "firstName", "lastName", "nickname", "studentId"),
		links:    []string{"studentId", "picturePath"},
	},
	IndexEvents: {
		settings: indexSettings{
			SearchableAttributes: []string{"titleSv", "titleEn", "descriptionSv", "descriptionEn"},
			// Newer events rank higher.
			RankingRules:       rankingRules("startDatetime:desc"),
			SortableAttributes: []string{"startDatetime"},
		},
		weight: 1,
		searchOn: map[string][]string{
			"sv": {"titleSv", "descriptionSv"},
			"en": {"titleEn", "descriptionEn"},
		},
		links: []string{"slug"},
	},
	IndexArticles: {
		settings: indexSettings{
			SearchableAttributes: []string{"headerSv", "headerEn", "bodySv", "bodyEn"},
			RankingRules:         rankingRules(),
			SortableAttributes:   []string{"publishedAt"},
		},
		weight: 1,
		searchOn: map[string][]string{
			"sv": {"headerSv", "bodySv"},
			"en": {"headerEn", "bodyEn"},
		},
		links: []string{"slug"},
	},
	IndexPositions: {
		settings: indexSettings{
			SearchableAttributes: []string{
				"nameSv", "nameEn", "descriptionSv", "descriptionEn",
				"committeeNameSv", "committeeNameEn", "dsekId",
			},
			RankingRules: rankingRules(),
		},
		weight: 1.5,
		searchOn: map[string][]string{
			"sv": {"nameSv", "descriptionSv", "committeeNameSv", "dsekId"},
			"en": {"nameEn", "descriptionEn", "committeeNameEn", "dsekId"},
		},
		links: []string{"dsekId"},
	},
	IndexSongs: {
		settings: indexSettings{
			SearchableAttributes: []string{"title", "lyrics", "melody", "category"},
			RankingRules:         rankingRules(),
		},
		weight:   1,
		searchOn: sameForBoth("title", "lyrics", "melody", "category"),
		links:    []string{"slug"},
	},
	IndexCommittees: {
		settings: indexSettings{
			SearchableAttributes: []string{"nameSv", "nameEn", "descriptionSv", "descriptionEn"},
			RankingRules:         rankingRules(),
		},
		weight: 2,
		searchOn: map[string][]string{
			"sv": {"nameSv", "descriptionSv"},
			"en": {"nameEn", "descriptionEn"},
		},
		links: []string{"shortName", "darkImageUrl", "lightImageUrl", "monoImageUrl"},
	},
	IndexGoverningDocuments: {
		settings: indexSettings{
			SearchableAttributes: []string{"title", "content"},
			RankingRules:         rankingRules(),
		},
		weight:   1,
		searchOn: sameForBoth("title", "content"),
		links:    []string{"url"},
	},
	IndexMeetingDocuments: {
		settings: indexSettings{
			SearchableAttributes: []string{"title", "content"},
			RankingRules:         rankingRules(),
		},
		weight:   1,
		searchOn: sameForBoth("title", "content"),
		links:    []string{"url"},
	},
}

// linkAttributes is every index's links, flattened - the old app applied
// one shared list to every hit regardless of its index, kept that way.
var linkAttributes = func() map[string]bool {
	set := map[string]bool{}
	for _, def := range indexDefs {
		for _, attr := range def.links {
			set[attr] = true
		}
	}
	return set
}()

var nonMeiliIDChars = regexp.MustCompile(`[^a-zA-Z0-9_-]`)

// meiliID turns a database id into a valid Meilisearch document id
// (a-z, A-Z, 0-9, - and _ only). Position ids contain dots and possibly
// åäö, so - like the old prismaIdToMeiliId - this base64s the UTF-8 bytes
// and drops the characters base64 adds that Meilisearch rejects.
func meiliID(id string) string {
	return nonMeiliIDChars.ReplaceAllString(base64.StdEncoding.EncodeToString([]byte(id)), "")
}
