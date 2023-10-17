
-- DROP OLD FOREIGN KEY CONSTRAINTS
ALTER TABLE "article_tags" DROP CONSTRAINT "article_tags_article_id_foreign";
ALTER TABLE "article_tags" DROP CONSTRAINT "article_tags_tag_id_foreign";

ALTER TABLE "booking_bookables" DROP CONSTRAINT "booking_bookables_bookable_id_foreign";
ALTER TABLE "booking_bookables" DROP CONSTRAINT "booking_bookables_booking_request_id_foreign";

ALTER TABLE "event_going" DROP CONSTRAINT "event_likes_event_id_foreign";
ALTER TABLE "event_going" DROP CONSTRAINT "event_likes_member_id_foreign";

ALTER TABLE "event_interested" DROP CONSTRAINT "event_interested_event_id_foreign";
ALTER TABLE "event_interested" DROP CONSTRAINT "event_interested_member_id_foreign";

ALTER TABLE "events_tags" DROP CONSTRAINT "events_tags_event_id_foreign";
ALTER TABLE "events_tags" DROP CONSTRAINT "events_tags_tag_id_foreign";

ALTER TABLE "tag_subscriptions" DROP CONSTRAINT "tag_subscriptions_member_id_foreign";
ALTER TABLE "tag_subscriptions" DROP CONSTRAINT "token_tags_tag_id_foreign";


-- CREATE TABLES
CREATE TABLE "_article_tags" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE TABLE "_booking_requests_bookables" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE TABLE "_event_going" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE TABLE "_event_interested" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE TABLE "_event_tags" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE TABLE "_member_tag_subscriptions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_article_tags_AB_unique" ON "_article_tags"("A", "B");
CREATE INDEX "_article_tags_B_index" ON "_article_tags"("B");

CREATE UNIQUE INDEX "_booking_requests_bookables_AB_unique" ON "_booking_requests_bookables"("A", "B");
CREATE INDEX "_booking_requests_bookables_B_index" ON "_booking_requests_bookables"("B");

CREATE UNIQUE INDEX "_event_going_AB_unique" ON "_event_going"("A", "B");
CREATE INDEX "_event_going_B_index" ON "_event_going"("B");

CREATE UNIQUE INDEX "_event_interested_AB_unique" ON "_event_interested"("A", "B");
CREATE INDEX "_event_interested_B_index" ON "_event_interested"("B");

CREATE UNIQUE INDEX "_event_tags_AB_unique" ON "_event_tags"("A", "B");
CREATE INDEX "_event_tags_B_index" ON "_event_tags"("B");

CREATE UNIQUE INDEX "_member_tag_subscriptions_AB_unique" ON "_member_tag_subscriptions"("A", "B");
CREATE INDEX "_member_tag_subscriptions_B_index" ON "_member_tag_subscriptions"("B");

-- ADD FOREIGN KEYS
ALTER TABLE "_article_tags" ADD CONSTRAINT "_article_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_article_tags" ADD CONSTRAINT "_article_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_booking_requests_bookables" ADD CONSTRAINT "_booking_requests_bookables_A_fkey" FOREIGN KEY ("A") REFERENCES "bookables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_booking_requests_bookables" ADD CONSTRAINT "_booking_requests_bookables_B_fkey" FOREIGN KEY ("B") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_event_going" ADD CONSTRAINT "_event_going_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_event_going" ADD CONSTRAINT "_event_going_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_event_interested" ADD CONSTRAINT "_event_interested_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_event_interested" ADD CONSTRAINT "_event_interested_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_event_tags" ADD CONSTRAINT "_event_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_event_tags" ADD CONSTRAINT "_event_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_member_tag_subscriptions" ADD CONSTRAINT "_member_tag_subscriptions_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_member_tag_subscriptions" ADD CONSTRAINT "_member_tag_subscriptions_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MIGRATE OVER OLD DATA
INSERT INTO "_article_tags" ("A", "B") SELECT "article_id", "tag_id" FROM "article_tags";
INSERT INTO "_booking_requests_bookables" ("A", "B") SELECT "bookable_id", "booking_request_id" FROM "booking_bookables";
INSERT INTO "_event_going" ("A", "B") SELECT "event_id", "member_id" FROM "event_going";
INSERT INTO "_event_interested" ("A", "B") SELECT "event_id", "member_id" FROM "event_interested";
INSERT INTO "_event_tags" ("A", "B") SELECT "event_id", "tag_id" FROM "events_tags";
INSERT INTO "_member_tag_subscriptions" ("A", "B") SELECT "member_id", "tag_id" FROM "tag_subscriptions";


-- DROP OLD TABLES
DROP TABLE "article_tags";
DROP TABLE "booking_bookables";
DROP TABLE "event_going";
DROP TABLE "event_interested";
DROP TABLE "tag_subscriptions";