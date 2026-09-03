package notifications

import (
	"fmt"
	"sort"
)

// rawNotification is one row straight from the notifications table, plus
// its resolved sender - the input to groupNotifications, mirroring
// ExpandedNotification.
type rawNotification struct {
	Group
	fromAuthor *NotificationAuthor
}

// groupAuthorNames mirrors group.ts's groupAuthorNames - the
// "John Smith, Jane Doe och 3 andra" text for a merged group.
//
// Real bug fixed while porting, not replicated: the old TS's exactly-3-
// authors branch read `getAuthorName(secondAuthor)` into `thirdAuthorName`
// (a copy-paste typo - it should have read the third author), so a group of
// exactly 3 always displayed the second author's name twice. Unambiguous
// typo, not a design choice - same class of fix as songbook's minutes
// substring comma bug.
func groupAuthorNames(authors []NotificationAuthor) string {
	n := len(authors)
	if n == 0 {
		return "Någon"
	}
	first := authors[0].Name
	if n == 1 {
		return first
	}
	if n == 2 {
		return fmt.Sprintf("%s och %s", first, authors[1].Name)
	}
	if n > 3 {
		return fmt.Sprintf("%s, %s och %d andra", first, authors[1].Name, n-2)
	}
	// exactly 3
	return fmt.Sprintf("%s, %s och %s", first, authors[1].Name, authors[2].Name)
}

// getGroupTexts mirrors getGroupTexts - synthesizes a merged group's
// title/message. Only called for types where shouldMergeNotifications is
// true (see mergeNotifications below), matching the old switch's coverage
// exactly (it panics on an unhandled type; NEW_ARTICLE/COMMENT/etc. never
// reach here since they never merge).
func getGroupTexts(g Group) (title, message string) {
	names := groupAuthorNames(g.Authors)
	switch NotificationType(g.Type) {
	case TypeNewsLike:
		return g.Title, fmt.Sprintf("%s har gillat din nyhet", names)
	case TypeEventLike:
		return g.Title, fmt.Sprintf("%s har gillat ditt evenemang", names)
	case TypeMention:
		return fmt.Sprintf("%s har nämnt dig i kommentarer", names), g.Message
	case TypeEventGoing:
		return g.Title, fmt.Sprintf("%s kommer", names)
	case TypeEventInterested:
		return g.Title, fmt.Sprintf("%s är intresserade", names)
	case TypePing:
		return g.Title, fmt.Sprintf("%s har pingat dig", names)
	default:
		// Matches the old code's thrown error for an unmerged type reaching
		// here - shouldn't happen since mergeNotifications only calls this
		// when shouldMergeNotifications[type] is true, and every true entry
		// is handled above.
		return g.Title, g.Message
	}
}

func mergeGroup(notifications []rawNotification) Group {
	most := notifications[0]
	seen := make(map[string]bool)
	var authors []NotificationAuthor
	for _, n := range notifications {
		if n.fromAuthor == nil || seen[n.fromAuthor.ID] {
			continue
		}
		seen[n.fromAuthor.ID] = true
		authors = append(authors, *n.fromAuthor)
	}
	readAt := most.ReadAt
	for _, n := range notifications {
		if n.ReadAt == nil {
			readAt = nil
			break
		}
	}
	individualIDs := make([]int32, len(notifications))
	for i, n := range notifications {
		individualIDs[i] = n.ID
	}
	group := Group{
		ID:            most.ID,
		Title:         most.Title,
		Message:       most.Message,
		Type:          most.Type,
		Link:          most.Link,
		ReadAt:        readAt,
		CreatedAt:     most.CreatedAt,
		Authors:       authors,
		IndividualIDs: individualIDs,
	}
	if shouldMergeNotifications[NotificationType(group.Type)] && len(notifications) > 1 {
		group.Title, group.Message = getGroupTexts(group)
	}
	return group
}

func toGroup(n rawNotification) Group {
	var authors []NotificationAuthor
	if n.fromAuthor != nil {
		authors = []NotificationAuthor{*n.fromAuthor}
	}
	return Group{
		ID:            n.ID,
		Title:         n.Title,
		Message:       n.Message,
		Type:          n.Type,
		Link:          n.Link,
		ReadAt:        n.ReadAt,
		CreatedAt:     n.CreatedAt,
		Authors:       authors,
		IndividualIDs: []int32{n.ID},
	}
}

// mergeNotifications mirrors mergeNotifications: a same-(type,link) bucket
// either collapses into one Group (if shouldMergeNotifications[type]) or
// stays as one Group per notification.
func mergeNotifications(bucket []rawNotification) []Group {
	if len(bucket) == 1 {
		return []Group{toGroup(bucket[0])}
	}
	if !shouldMergeNotifications[NotificationType(bucket[0].Type)] {
		groups := make([]Group, len(bucket))
		for i, n := range bucket {
			groups[i] = toGroup(n)
		}
		return groups
	}
	return []Group{mergeGroup(bucket)}
}

// groupNotifications mirrors groupNotifications - buckets by (type, link),
// merges each bucket, then re-sorts every resulting Group latest-first
// (bucketing loses the original ordering, same as the old Object-keyed
// implementation).
func groupNotifications(notifications []rawNotification) []Group {
	order := make([]string, 0)
	buckets := make(map[string][]rawNotification)
	for _, n := range notifications {
		key := n.Type + ";" + n.Link
		if _, ok := buckets[key]; !ok {
			order = append(order, key)
		}
		buckets[key] = append(buckets[key], n)
	}
	var groups []Group
	for _, key := range order {
		groups = append(groups, mergeNotifications(buckets[key])...)
	}
	sort.SliceStable(groups, func(i, j int) bool {
		return groups[i].CreatedAt.After(groups[j].CreatedAt)
	})
	return groups
}
