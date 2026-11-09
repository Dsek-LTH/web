-- Café shifts are one row per day and time slot, stored at midnight UTC
-- (Go's cafe.SetShift), and the schedule matches days exactly. The old app
-- stored dayjs(date).startOf("day") in the server's local time, so if it ran
-- in Swedish time its shifts sit at 22:00 or 23:00 UTC the day before, and
-- would show on the wrong day and couldn't be toggled off. Move any shift
-- not at midnight to the midnight of its Swedish day. A no-op if the old
-- server ran in UTC. A shift that would collide with one already on that
-- day and slot is left alone.
UPDATE cafe_shifts cs
SET date = date_trunc('day', cs.date + interval '2 hours')
WHERE cs.date::time <> '00:00'
  AND NOT EXISTS (
      SELECT 1 FROM cafe_shifts other
      WHERE other.date = date_trunc('day', cs.date + interval '2 hours')
        AND other.time_slot = cs.time_slot
  );
