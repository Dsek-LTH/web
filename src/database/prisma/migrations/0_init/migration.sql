-- CreateEnum
CREATE TYPE "governing_document_type" AS ENUM ('POLICY', 'GUIDELINE');

-- CreateTable
CREATE TABLE "admin_settings" (
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "severity" VARCHAR(255) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "message_en" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ(6),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_access_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "api_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255),
    "student_id" VARCHAR(255),

    CONSTRAINT "api_access_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "content" VARCHAR(255),
    "published" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_likes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID,
    "approved_datetime" TIMESTAMPTZ(6),
    "rejected_datetime" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "handled_by" UUID,
    "should_send_notification" BOOLEAN DEFAULT false,
    "notification_body" VARCHAR(255),
    "notification_body_en" VARCHAR(255),

    CONSTRAINT "article_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "header" VARCHAR(255) NOT NULL,
    "header_en" VARCHAR(255),
    "body" TEXT NOT NULL,
    "body_en" TEXT,
    "image_url" VARCHAR(255),
    "author_id" UUID NOT NULL,
    "published_datetime" TIMESTAMPTZ(6),
    "latest_edit_datetime" TIMESTAMPTZ(6),
    "slug" VARCHAR(255),
    "removed_at" TIMESTAMPTZ(6),
    "status" TEXT DEFAULT 'approved',
    "created_datetime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enforce_status_type" CHECK ((((status)::text = 'draft'::text) OR ((status)::text = 'approved'::text) OR ((status)::text = 'rejected'::text))),
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_backup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_type" VARCHAR,

    CONSTRAINT "author_backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "mandate_id" UUID,
    "custom_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" character varying GENERATED ALWAYS AS (
    CASE
        WHEN ((mandate_id IS NULL) AND (custom_id IS NULL)) THEN 'Member'::text
        WHEN ((mandate_id IS NOT NULL) AND (custom_id IS NULL)) THEN 'Mandate'::text
        WHEN ((mandate_id IS NULL) AND (custom_id IS NOT NULL)) THEN 'Custom'::text
        ELSE NULL::text
    END) STORED,
    CONSTRAINT "enforce_author_type" CHECK ((((mandate_id IS NULL) AND (custom_id IS NULL)) OR ((mandate_id IS NOT NULL) AND (custom_id IS NULL)) OR ((mandate_id IS NULL) AND (custom_id IS NOT NULL)))),

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookable_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),

    CONSTRAINT "bookable_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "category_id" UUID,
    "door" VARCHAR(255),

    CONSTRAINT "bookables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_bookables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_request_id" UUID,
    "bookable_id" UUID,

    CONSTRAINT "booking_bookables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booker_id" UUID,
    "start" TIMESTAMPTZ(6),
    "end" TIMESTAMPTZ(6),
    "created" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "event" VARCHAR(255),
    "status" VARCHAR(255),

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255) NOT NULL,
    "total_price" REAL NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "product_inventory_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "short_name" VARCHAR(255),

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_author_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "custom_author_id" UUID NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_author_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_authors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "door_access_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "door_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255),
    "student_id" VARCHAR(255),
    "start_datetime" TIMESTAMPTZ(6),
    "end_datetime" TIMESTAMPTZ(6),

    CONSTRAINT "door_access_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doors" (
    "name" VARCHAR(255) NOT NULL,
    "id" VARCHAR(255),

    CONSTRAINT "doors_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "email_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position_id" VARCHAR(255),
    "email" VARCHAR(255),
    "can_send" BOOLEAN DEFAULT false,

    CONSTRAINT "mail_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "content" TEXT,
    "published" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_going" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "event_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_interested" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "event_interested_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "title_en" VARCHAR(255),
    "description" TEXT NOT NULL,
    "description_en" TEXT,
    "link" VARCHAR(255),
    "location" VARCHAR(255),
    "organizer" VARCHAR(255) NOT NULL,
    "author_id" UUID NOT NULL,
    "short_description" VARCHAR(255) NOT NULL,
    "short_description_en" VARCHAR(255),
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6) NOT NULL,
    "number_of_updates" INTEGER DEFAULT 0,
    "slug" VARCHAR(255),
    "alarm_active" BOOLEAN DEFAULT false,
    "removed_at" TIMESTAMPTZ(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "events_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expo_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID,
    "expo_token" VARCHAR(255),

    CONSTRAINT "expo_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governing_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "document_type" "governing_document_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "governing_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keycloak" (
    "keycloak_id" VARCHAR(255) NOT NULL,
    "member_id" UUID,

    CONSTRAINT "keycloak_pkey" PRIMARY KEY ("keycloak_id")
);

-- CreateTable
CREATE TABLE "knex_migrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "batch" INTEGER,
    "migration_time" TIMESTAMPTZ(6),

    CONSTRAINT "knex_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knex_migrations_lock" (
    "index" SERIAL NOT NULL,
    "is_locked" INTEGER,

    CONSTRAINT "knex_migrations_lock_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "mandates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "position_id" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "in_keycloak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markdowns" (
    "name" VARCHAR(255) NOT NULL,
    "markdown" TEXT NOT NULL,
    "markdown_en" TEXT,

    CONSTRAINT "markdowns_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255),
    "first_name" VARCHAR(255),
    "nickname" VARCHAR(255),
    "last_name" VARCHAR(255),
    "picture_path" VARCHAR(255),
    "class_programme" VARCHAR(255),
    "class_year" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "food_preference" VARCHAR(255),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "link" VARCHAR(255) NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_author_id" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255) NOT NULL,
    "payment_id" UUID NOT NULL,
    "total_price" REAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_inventory_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "discount_percentage" REAL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255) NOT NULL,
    "swish_id" VARCHAR(255) NOT NULL,
    "payment_method" VARCHAR(255) NOT NULL,
    "payment_status" VARCHAR(255) NOT NULL,
    "payment_amount" VARCHAR(255) NOT NULL,
    "payment_currency" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_member" UUID,
    "to_member" UUID,
    "from_sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "to_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER DEFAULT 1,

    CONSTRAINT "pings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "committee_id" UUID,
    "email" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "board_member" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "description_en" TEXT,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "price" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "category_id" UUID NOT NULL,
    "max_per_user" INTEGER NOT NULL DEFAULT 1000,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "release_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_discount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "discount_percentage" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "product_discount_id" UUID,
    "quantity" INTEGER NOT NULL,
    "variant" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "lyrics" TEXT NOT NULL,
    "melody" VARCHAR(255),
    "category" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_receivers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "target_email" VARCHAR(255) NOT NULL,

    CONSTRAINT "special_receivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_senders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "student_id" VARCHAR(255) NOT NULL,
    "keycloak_id" VARCHAR(255),

    CONSTRAINT "special_senders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "push_notification" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscription_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tag_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "token_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "color" VARCHAR(255),
    "is_default" BOOLEAN DEFAULT false,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_inventory_id" UUID NOT NULL,
    "product_inventory_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "student_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "paid_price" REAL NOT NULL,
    "variant" VARCHAR(255),
    "paid_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMPTZ(6),
    "product_id" UUID,

    CONSTRAINT "user_inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_likes_article_id_member_id_unique" ON "article_likes"("article_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_requests_article_id_unique" ON "article_requests"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_tags_article_id_tag_id_unique" ON "article_tags"("article_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_unique" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "authors_member_id_mandate_id_custom_id_unique" ON "authors"("member_id", "mandate_id", "custom_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_likes_event_id_member_id_unique" ON "event_going"("event_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_interested_event_id_member_id_unique" ON "event_interested"("event_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_unique" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_tags_event_id_tag_id_unique" ON "events_tags"("event_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "expo_tokens_expo_token_unique" ON "expo_tokens"("expo_token");

-- CreateIndex
CREATE UNIQUE INDEX "members_student_id_unique" ON "members"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_swish_id_unique" ON "payment"("swish_id");

-- CreateIndex
CREATE UNIQUE INDEX "pings_from_member_to_member_unique" ON "pings"("from_member", "to_member");

-- CreateIndex
CREATE UNIQUE INDEX "tag_subscriptions_member_id_tag_id_unique" ON "tag_subscriptions"("member_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventory_student_id_unique" ON "user_inventory"("student_id");

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_foreign" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_article_id_foreign" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_requests" ADD CONSTRAINT "article_requests_article_id_foreign" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_requests" ADD CONSTRAINT "article_requests_handled_by_foreign" FOREIGN KEY ("handled_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_foreign" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_foreign" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_foreign" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_custom_id_foreign" FOREIGN KEY ("custom_id") REFERENCES "custom_authors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_mandate_id_foreign" FOREIGN KEY ("mandate_id") REFERENCES "mandates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookables" ADD CONSTRAINT "bookables_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "bookable_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_bookables" ADD CONSTRAINT "booking_bookables_bookable_id_foreign" FOREIGN KEY ("bookable_id") REFERENCES "bookables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_bookables" ADD CONSTRAINT "booking_bookables_booking_request_id_foreign" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_inventory_id_foreign" FOREIGN KEY ("product_inventory_id") REFERENCES "product_inventory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "custom_author_roles" ADD CONSTRAINT "custom_author_roles_custom_author_id_foreign" FOREIGN KEY ("custom_author_id") REFERENCES "custom_authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "door_access_policies" ADD CONSTRAINT "door_access_policies_door_name_foreign" FOREIGN KEY ("door_name") REFERENCES "doors"("name") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_aliases" ADD CONSTRAINT "email_aliases_position_id_foreign" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_event_id_foreign" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_going" ADD CONSTRAINT "event_likes_event_id_foreign" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_going" ADD CONSTRAINT "event_likes_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_interested" ADD CONSTRAINT "event_interested_event_id_foreign" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_interested" ADD CONSTRAINT "event_interested_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_author_id_foreign" FOREIGN KEY ("author_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events_tags" ADD CONSTRAINT "events_tags_event_id_foreign" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events_tags" ADD CONSTRAINT "events_tags_tag_id_foreign" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_position_id_foreign" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_from_author_id_foreign" FOREIGN KEY ("from_author_id") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_payment_id_foreign" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_inventory_id_foreign" FOREIGN KEY ("product_inventory_id") REFERENCES "product_inventory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pings" ADD CONSTRAINT "pings_from_member_foreign" FOREIGN KEY ("from_member") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pings" ADD CONSTRAINT "pings_to_member_foreign" FOREIGN KEY ("to_member") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_committee_id_foreign" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_product_discount_id_foreign" FOREIGN KEY ("product_discount_id") REFERENCES "product_discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_settings" ADD CONSTRAINT "subscription_settings_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tag_subscriptions" ADD CONSTRAINT "tag_subscriptions_member_id_foreign" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tag_subscriptions" ADD CONSTRAINT "token_tags_tag_id_foreign" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_inventory_item" ADD CONSTRAINT "user_inventory_item_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_inventory_item" ADD CONSTRAINT "user_inventory_item_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_inventory_item" ADD CONSTRAINT "user_inventory_item_product_inventory_id_foreign" FOREIGN KEY ("product_inventory_id") REFERENCES "product_inventory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_inventory_item" ADD CONSTRAINT "user_inventory_item_user_inventory_id_foreign" FOREIGN KEY ("user_inventory_id") REFERENCES "user_inventory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

