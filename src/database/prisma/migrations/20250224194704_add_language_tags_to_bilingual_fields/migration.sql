-- RAWDOGGED SQL baby 🤘😎

ALTER TABLE "alerts" RENAME COLUMN "message" TO "message_sv";

ALTER TABLE "article_requests" RENAME COLUMN "notification_body" TO "notification_body_sv";

ALTER TABLE "articles" RENAME COLUMN "body" TO "body_sv";
ALTER TABLE "articles" RENAME COLUMN "header" TO "header_sv";

ALTER TABLE "bookable_categories" RENAME COLUMN "name" TO "name_sv";

ALTER TABLE "bookables" RENAME COLUMN "name" TO "name_sv";

ALTER TABLE "committees" RENAME COLUMN "description" TO "description_sv";
ALTER TABLE "committees" RENAME COLUMN "name" TO "name_sv";

ALTER TABLE "custom_authors" RENAME COLUMN "name" TO "name_sv";

ALTER TABLE "elections" RENAME COLUMN "markdown" TO "markdown_sv";

ALTER TABLE "events" RENAME COLUMN "description" TO "description_sv";
ALTER TABLE "events" RENAME COLUMN "short_description" TO "short_description_sv";
ALTER TABLE "events" RENAME COLUMN "title" TO "title_sv";

ALTER TABLE "item_question" RENAME COLUMN "description" TO "description_sv"; 
ALTER TABLE "item_question" RENAME COLUMN "descriptionEn" TO "description_en";
ALTER TABLE "item_question" RENAME COLUMN "title" TO "title_sv";
ALTER TABLE "item_question" RENAME COLUMN "titleEn" TO "title_en";

ALTER TABLE "item_question_option" RENAME COLUMN "answer" TO "answer_sv";
ALTER TABLE "item_question_option" RENAME COLUMN "answerEn" TO "answer_en";

ALTER TABLE "markdowns" RENAME COLUMN "markdown" TO "markdown_sv";

ALTER TABLE "positions" RENAME COLUMN "description" TO "description_sv";
ALTER TABLE "positions" RENAME COLUMN "name" TO "name_sv";

ALTER TABLE "shoppable" RENAME COLUMN "description" TO "description_sv";
ALTER TABLE "shoppable" RENAME COLUMN "descriptionEn" TO "title_en";
ALTER TABLE "shoppable" RENAME COLUMN "title" TO "title_sv";
ALTER TABLE "shoppable" RENAME COLUMN "titleEn" TO "title_en";

ALTER TABLE "tags" RENAME COLUMN "name" TO "name_sv";
