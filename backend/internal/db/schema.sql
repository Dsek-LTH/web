-- Schema for the subset of the site's Postgres database that the Go backend
-- currently owns: articles, and everything articles depend on (authors,
-- members, committees, positions, mandates, tags, phadder groups).
--
-- This mirrors tables that already exist in the shared database (previously
-- managed by ../../src/database/schema.zmodel / Prisma migrations) — column
-- order, names, and constraints were checked against a live dev DB
-- (`\d <table>` in psql), not just transcribed from schema.prisma. It is not
-- run as a migration against that database; it exists so sqlc can
-- type-check queries against it.
--
-- Column order matters here: it must match the live table for `SELECT *`/
-- `RETURNING *` to scan into the right struct fields. Prefer writing
-- explicit column lists in queries/*.sql over `*` so this stops mattering.

CREATE TABLE committees (
    id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_sv               VARCHAR(255) NOT NULL,
    name_en               VARCHAR(255),
    short_name            VARCHAR(255) UNIQUE,
    description_sv        VARCHAR(255),
    description_en        VARCHAR(255),
    dark_image_url        TEXT,
    light_image_url       TEXT,
    mono_image_url        TEXT,
    symbol_url            TEXT,
    banner_url            TEXT,
    is_banner_text_light  BOOLEAN NOT NULL DEFAULT false,
    preview_url           TEXT
);

CREATE TABLE positions (
    id             VARCHAR(255) NOT NULL PRIMARY KEY,
    name_sv        VARCHAR(255) NOT NULL,
    name_en        VARCHAR(255),
    committee_id   UUID REFERENCES committees (id),
    email          VARCHAR(255),
    active         BOOLEAN NOT NULL DEFAULT true,
    board_member   BOOLEAN NOT NULL DEFAULT false,
    description_sv TEXT,
    description_en TEXT,
    end_month      INTEGER NOT NULL DEFAULT 11,
    start_month    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE phadder_groups (
    id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    year         INTEGER NOT NULL,
    image_url    TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE members (
    id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id         VARCHAR(255) UNIQUE,
    first_name         VARCHAR(255),
    nickname           VARCHAR(255),
    last_name          VARCHAR(255),
    picture_path       TEXT,
    class_programme    VARCHAR(255),
    class_year         INTEGER,
    visible            BOOLEAN NOT NULL DEFAULT true,
    food_preference    VARCHAR(255),
    bio                TEXT,
    stripe_customer_id TEXT,
    email              VARCHAR(255) UNIQUE,
    nollning_group_id  UUID REFERENCES phadder_groups (id) ON DELETE SET NULL,
    graduation_year    INTEGER,
    language           VARCHAR(255)
);

CREATE TABLE mandates (
    id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id      UUID NOT NULL REFERENCES members (id),
    position_id    VARCHAR(255) NOT NULL REFERENCES positions (id),
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    "phadderInId"  UUID REFERENCES phadder_groups (id) ON DELETE SET NULL,
    last_synced    DATE NOT NULL
);

CREATE TABLE custom_authors (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_sv    VARCHAR(255) NOT NULL,
    name_en    VARCHAR(255),
    image_url  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_author_roles (
    id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    custom_author_id UUID NOT NULL REFERENCES custom_authors (id) ON DELETE CASCADE,
    role             VARCHAR(255) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- An author is one of: a plain member, a member acting under a mandate
-- (position they held at the time), or a custom (non-member) byline.
CREATE TABLE authors (
    id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id   UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    mandate_id  UUID REFERENCES mandates (id) ON DELETE SET NULL,
    custom_id   UUID REFERENCES custom_authors (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    type        VARCHAR(255) GENERATED ALWAYS AS (
        CASE
            WHEN mandate_id IS NULL AND custom_id IS NULL THEN 'Member'
            WHEN mandate_id IS NOT NULL AND custom_id IS NULL THEN 'Mandate'
            WHEN mandate_id IS NULL AND custom_id IS NOT NULL THEN 'Custom'
            ELSE NULL
        END
    ) STORED,
    UNIQUE (member_id, mandate_id, custom_id),
    CONSTRAINT enforce_author_type CHECK (
        (mandate_id IS NULL AND custom_id IS NULL)
        OR (mandate_id IS NOT NULL AND custom_id IS NULL)
        OR (mandate_id IS NULL AND custom_id IS NOT NULL)
    )
);

CREATE TABLE tags (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_sv    VARCHAR(255) NOT NULL,
    name_en    VARCHAR(255),
    color      VARCHAR(255),
    is_default BOOLEAN DEFAULT false
);

CREATE TABLE articles (
    id                       UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    header_sv                VARCHAR(255) NOT NULL,
    header_en                VARCHAR(255),
    body_sv                  TEXT NOT NULL,
    body_en                  TEXT,
    image_url                TEXT,
    author_id                UUID NOT NULL REFERENCES authors (id) ON DELETE CASCADE,
    published_datetime       TIMESTAMPTZ,
    latest_edit_datetime     TIMESTAMPTZ,
    slug                     VARCHAR(255) NOT NULL UNIQUE,
    removed_at               TIMESTAMPTZ,
    status                   TEXT DEFAULT 'approved',
    created_datetime         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    youtube_url              TEXT,
    image_urls               TEXT[],
    notification_text        VARCHAR(255),
    scheduled_id             TEXT,
    should_send_notification BOOLEAN DEFAULT false,
    committee_id             UUID REFERENCES committees (id),
    CONSTRAINT enforce_status_type CHECK (
        status = 'draft' OR status = 'approved' OR status = 'rejected'
    )
);

CREATE TABLE article_comments (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    member_id  UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    content    VARCHAR(255),
    published  TIMESTAMPTZ NOT NULL
);

CREATE TABLE article_requests (
    id                        UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id                UUID UNIQUE REFERENCES articles (id) ON DELETE CASCADE,
    approved_datetime         TIMESTAMPTZ,
    rejected_datetime         TIMESTAMPTZ,
    rejection_reason         TEXT,
    handled_by                UUID REFERENCES members (id) ON DELETE SET NULL,
    should_send_notification  BOOLEAN DEFAULT false,
    notification_body_sv      VARCHAR(255),
    notification_body_en      VARCHAR(255)
);

-- Operator-managed grants read by internal/auth to resolve an Identity's
-- Policies: a row grants api_name to either a role (matched against
-- getDerivedRoles' output) or a specific student_id, never both.
CREATE TABLE api_access_policies (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_name   VARCHAR(255) NOT NULL,
    role       VARCHAR(255),
    student_id VARCHAR(255) REFERENCES members (student_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Implicit Prisma many-to-many join tables (named "_article_tags" /
-- "_article_likes" in the live DB); kept as-is rather than renamed.
CREATE TABLE _article_tags (
    "A" UUID NOT NULL REFERENCES articles (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "B" UUID NOT NULL REFERENCES tags (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX _article_tags_ab_unique ON _article_tags ("A", "B");
CREATE INDEX _article_tags_b_index ON _article_tags ("B");

CREATE TABLE _article_likes (
    "A" UUID NOT NULL REFERENCES articles (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "B" UUID NOT NULL REFERENCES members (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX _article_likes_ab_unique ON _article_likes ("A", "B");
CREATE INDEX _article_likes_b_index ON _article_likes ("B");
