-- Every notification query is per member (the list, newest first; the
-- unread count the layout shows on every page; the push badge count; the
-- duplicate check), and without this each one scanned the whole table.
CREATE INDEX notifications_member_id_created_at_index
    ON notifications (member_id, created_at DESC);
