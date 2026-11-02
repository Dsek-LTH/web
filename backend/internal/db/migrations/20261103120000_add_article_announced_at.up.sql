-- When an article's go-live announcement (notification, push, Discord) was
-- handled - sent, or deliberately skipped. Go's announcement sweep
-- (internal/articles) announces live articles where this is still NULL,
-- replacing the external scheduler-service.
ALTER TABLE articles ADD COLUMN announced_at TIMESTAMPTZ;

-- Articles already live have had their chance; never announce them now.
UPDATE articles SET announced_at = published_datetime
WHERE published_datetime <= now();
