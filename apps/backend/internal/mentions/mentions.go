// Package mentions resolves the members @mentioned in comment text, so
// article/event detail responses can carry each mentioned member's current
// name alongside the comments (see EventDetail.TaggedMembers /
// ArticleDetail.TaggedMembers). The comment form stores a mention as
// markdown, "[@Name](/members/<studentId>)" - the name in it can go stale
// if the member renames themselves, which is why the frontend re-renders
// mentions from these members instead (replaceCommentTags in
// src/lib/utils/client/commentTagging.ts).
package mentions

import (
	"context"
	"fmt"
	"regexp"

	"github.com/dsek-lth/web/apps/backend/internal/apitypes"
	"github.com/dsek-lth/web/apps/backend/internal/db"
	"github.com/dsek-lth/web/apps/backend/internal/dbutil"
)

// tagRegex mirrors tagRegex in src/lib/utils/client/commentTagging.ts.
var tagRegex = regexp.MustCompile(`\[([^\]]*)\]\(/members/([^)]+)\)`)

// StudentIDs returns the distinct student IDs mentioned across contents,
// in first-seen order.
func StudentIDs(contents []string) []string {
	seen := map[string]bool{}
	var ids []string
	for _, c := range contents {
		for _, m := range tagRegex.FindAllStringSubmatch(c, -1) {
			if id := m[2]; id != "" && !seen[id] {
				seen[id] = true
				ids = append(ids, id)
			}
		}
	}
	return ids
}

// Resolve looks up every member mentioned across contents. Mentions of
// student IDs that don't exist are silently dropped - the frontend falls
// back to the name stored in the markdown for those.
func Resolve(ctx context.Context, q *db.Queries, contents []string) ([]apitypes.Member, error) {
	ids := StudentIDs(contents)
	if len(ids) == 0 {
		return []apitypes.Member{}, nil
	}
	rows, err := q.ListMembersByStudentIDs(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list mentioned members: %w", err)
	}
	members := make([]apitypes.Member, len(rows))
	for i, r := range rows {
		members[i] = apitypes.Member{
			ID:          dbutil.UUIDStr(r.ID),
			StudentID:   dbutil.TextPtr(r.StudentID),
			FirstName:   dbutil.TextPtr(r.FirstName),
			LastName:    dbutil.TextPtr(r.LastName),
			Nickname:    dbutil.TextPtr(r.Nickname),
			PicturePath: dbutil.TextPtr(r.PicturePath),
		}
	}
	return members, nil
}
