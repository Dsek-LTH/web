-- Measured on a copy of production (4.9M notifications, about 900 per
-- member, 95% unread).

-- The duplicate check before an announcement (ListMembersWithSubscriptionSetting)
-- looks up who already got a notification for a link: 17.6 s without
-- this, 3-8 ms with it. Each link repeats once per member, so B-tree
-- deduplication keeps this small (34 MB, a tenth of (member_id, link)).
CREATE INDEX notifications_link_index ON notifications (link);

-- Unread counts: the badge on every page and one per push token in the
-- push fan-out (3.1 s -> 74 ms). Index-only, no visit to the 1 GB table.
CREATE INDEX notifications_member_id_unread_index ON notifications (member_id)
    WHERE read_at IS NULL;

-- The news feed and event lists sort by these and take a page, so with
-- an index Postgres reads the first page in order instead of computing
-- every row's comment/like/attendance counts and sorting them all
-- (ListArticles 40 ms -> 0.4 ms, past events 52 ms -> 0.4 ms).
CREATE INDEX articles_published_datetime_index ON articles (published_datetime);
CREATE INDEX events_start_datetime_index ON events (start_datetime);
