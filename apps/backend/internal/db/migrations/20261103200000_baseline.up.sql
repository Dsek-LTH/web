-- The schema as of the last Prisma migration (20261103200000_add_member_birth_date),
-- replacing the 77 migrations Prisma had applied by then (they are in git
-- history). A database Prisma migrated is exactly this, so `migrate up`
-- adopts one by recording this version as applied (cmd/migrate, adopt.go)
-- instead of running it. Generated with pg_dump --schema-only from a
-- database built from those migrations; session settings and psql
-- meta-commands removed. It keeps tables nothing uses anymore (the webshop,
-- expenses, ...): it has to match what production has.
--
-- There is no down migration: undoing this means dropping the database.

--
--

--
-- Name: BookingRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingRequestStatus" AS ENUM (
    'ACCEPTED',
    'DENIED',
    'PENDING'
);

--
-- Name: DrinkGroup; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DrinkGroup" AS ENUM (
    'S1',
    'S2',
    'S3',
    'S4'
);

--
-- Name: DrinkQuantityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DrinkQuantityType" AS ENUM (
    'NONE',
    'WEIGHT',
    'COUNTS'
);

--
-- Name: ShoppableType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShoppableType" AS ENUM (
    'TICKET'
);

--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'POLICY',
    'GUIDELINE',
    'MEETING',
    'OTHER',
    'PLAN_OF_OPERATIONS',
    'FRAMEWORK_BUDGET',
    'STRATEGIC_GOALS'
);

--
-- Name: recurringType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."recurringType" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
);

--
-- Name: time_slots; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.time_slots AS ENUM (
    'DAYMANAGER',
    'SHIFT_1',
    'SHIFT_2',
    'SHIFT_3'
);

--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    policies text[],
    "memberId" text NOT NULL,
    "studentId" text NOT NULL,
    "externalCode" text,
    roles text[]
);

--
-- Name: _alerts_closed_by; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._alerts_closed_by (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _article_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._article_likes (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _article_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._article_tags (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _booking_requests_access_doors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._booking_requests_access_doors (
    "A" uuid NOT NULL,
    "B" character varying(255) NOT NULL
);

--
-- Name: _booking_requests_access_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._booking_requests_access_members (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _booking_requests_bookables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._booking_requests_bookables (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _event_going; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._event_going (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _event_interested; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._event_interested (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _event_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._event_tags (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: _member_tag_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._member_tag_subscriptions (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    key character varying(255) NOT NULL,
    value character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    severity character varying(255) NOT NULL,
    message_sv character varying(255) NOT NULL,
    message_en character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    removed_at timestamp(6) with time zone
);

--
-- Name: api_access_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_access_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_name character varying(255) NOT NULL,
    role character varying(255),
    student_id character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: article_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    member_id uuid NOT NULL,
    content character varying(255),
    published timestamp(6) with time zone NOT NULL
);

--
-- Name: article_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    approved_datetime timestamp(6) with time zone,
    rejected_datetime timestamp(6) with time zone,
    rejection_reason text,
    handled_by uuid,
    should_send_notification boolean DEFAULT false,
    notification_body_sv character varying(255),
    notification_body_en character varying(255)
);

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    header_sv character varying(255) NOT NULL,
    header_en character varying(255),
    body_sv text NOT NULL,
    body_en text,
    image_url text,
    author_id uuid NOT NULL,
    published_datetime timestamp(6) with time zone,
    latest_edit_datetime timestamp(6) with time zone,
    slug character varying(255) NOT NULL,
    removed_at timestamp(6) with time zone,
    status text DEFAULT 'approved'::text,
    created_datetime timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    youtube_url text,
    image_urls text[],
    notification_text character varying(255),
    scheduled_id text,
    should_send_notification boolean DEFAULT false,
    committee_id uuid,
    discord_announced_at timestamp(6) with time zone,
    CONSTRAINT enforce_status_type CHECK (((status = 'draft'::text) OR (status = 'approved'::text) OR (status = 'rejected'::text)))
);

--
-- Name: authors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    mandate_id uuid,
    custom_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type character varying(255) GENERATED ALWAYS AS (
CASE
    WHEN ((mandate_id IS NULL) AND (custom_id IS NULL)) THEN 'Member'::text
    WHEN ((mandate_id IS NOT NULL) AND (custom_id IS NULL)) THEN 'Mandate'::text
    WHEN ((mandate_id IS NULL) AND (custom_id IS NOT NULL)) THEN 'Custom'::text
    ELSE NULL::text
END) STORED,
    CONSTRAINT enforce_author_type CHECK ((((mandate_id IS NULL) AND (custom_id IS NULL)) OR ((mandate_id IS NOT NULL) AND (custom_id IS NULL)) OR ((mandate_id IS NULL) AND (custom_id IS NOT NULL))))
);

--
-- Name: bookable_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookable_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255)
);

--
-- Name: bookables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255),
    "isDisabled" boolean DEFAULT false NOT NULL,
    category_id uuid,
    door character varying(255)
);

--
-- Name: booking_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booker_id uuid,
    start timestamp(6) with time zone,
    "end" timestamp(6) with time zone,
    created timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    event character varying(255),
    status public."BookingRequestStatus" DEFAULT 'PENDING'::public."BookingRequestStatus" NOT NULL
);

--
-- Name: cafe_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cafe_shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "workerId" uuid NOT NULL,
    time_slot public.time_slots NOT NULL
);

--
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying(255) NOT NULL,
    total_price real NOT NULL,
    total_quantity integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(6) with time zone
);

--
-- Name: cart_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_inventory_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);

--
-- Name: ciabatta_of_the_week; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ciabatta_of_the_week (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    year integer NOT NULL,
    week integer NOT NULL,
    name text NOT NULL
);

--
-- Name: committees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255),
    short_name character varying(255),
    description_sv character varying(255),
    description_en character varying(255),
    dark_image_url text,
    light_image_url text,
    mono_image_url text,
    symbol_url text,
    banner_url text,
    is_banner_text_light boolean DEFAULT false NOT NULL,
    preview_url text
);

--
-- Name: consumable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consumable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "shoppableId" uuid NOT NULL,
    "memberId" uuid,
    "externalCustomerEmail" text,
    "externalCustomerCode" text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    purchased_at timestamp(6) with time zone,
    consumed_at timestamp(6) with time zone,
    expires_at timestamp(6) with time zone,
    stripe_intent_id text,
    "priceAtPurchase" integer
);

--
-- Name: consumable_reservation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consumable_reservation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "shoppableId" uuid NOT NULL,
    "memberId" uuid,
    "externalCustomerEmail" text,
    "externalCustomerCode" text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "order" integer
);

--
-- Name: custom_author_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_author_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    custom_author_id uuid NOT NULL,
    role character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: custom_authors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_authors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255),
    image_url text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    url character varying(255) NOT NULL,
    type public.document_type NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone
);

--
-- Name: door_access_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.door_access_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    door_name character varying(255) NOT NULL,
    role character varying(255),
    student_id character varying(255),
    start_datetime timestamp(6) with time zone,
    end_datetime timestamp(6) with time zone,
    is_ban boolean DEFAULT false NOT NULL,
    information character varying(255),
    booking_request_id uuid
);

--
-- Name: doors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doors (
    name character varying(255) NOT NULL,
    id character varying(255),
    verbose_name character varying(255) NOT NULL
);

--
-- Name: drinkitem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drinkitem (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quantity_type public."DrinkQuantityType" NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    "group" public."DrinkGroup" NOT NULL,
    systembolaget_id integer NOT NULL,
    bottle_empty_weight integer,
    bottle_full_weight integer,
    quantity_available integer DEFAULT 0,
    nr_bottles integer DEFAULT 0
);

--
-- Name: drinkitembatch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drinkitembatch (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    drink_item_id uuid NOT NULL,
    "user" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    quantity_delta integer NOT NULL,
    nr_bottles_delta integer
);

--
-- Name: elections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    committee_id uuid NOT NULL,
    markdown_sv text NOT NULL,
    markdown_en text,
    link text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL
);

--
-- Name: email_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_aliases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    position_id character varying(255) NOT NULL,
    email character varying(255) NOT NULL
);

--
-- Name: event_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    member_id uuid NOT NULL,
    content text,
    published timestamp(6) with time zone NOT NULL
);

--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_sv character varying(255) NOT NULL,
    title_en character varying(255),
    description_sv text NOT NULL,
    description_en text,
    link character varying(255),
    location character varying(255),
    organizer character varying(255) NOT NULL,
    author_id uuid NOT NULL,
    short_description_sv character varying(255),
    short_description_en character varying(255),
    start_datetime timestamp(6) with time zone NOT NULL,
    end_datetime timestamp(6) with time zone NOT NULL,
    number_of_updates integer DEFAULT 0,
    slug character varying(255),
    alarm_active boolean DEFAULT false,
    removed_at timestamp(6) with time zone,
    "imageUrl" text,
    is_detatched boolean DEFAULT false NOT NULL,
    recurring_parent_id uuid,
    is_cancelled boolean DEFAULT false,
    committee_id uuid
);

--
-- Name: events_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    tag_id uuid NOT NULL
);

--
-- Name: expense_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_id integer NOT NULL,
    "committeeShortName" text NOT NULL,
    amount integer NOT NULL,
    "costCenter" text NOT NULL,
    comment text,
    "receiptUrl" text,
    "signerMemberId" uuid NOT NULL,
    "signedByMemberId" uuid,
    "signedAt" timestamp(3) without time zone
);

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text NOT NULL,
    "isGuildCard" boolean NOT NULL,
    "hasBeenSentToBookkeeping" boolean DEFAULT false NOT NULL,
    "memberId" uuid NOT NULL,
    "removedAt" timestamp(3) without time zone
);

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;

--
-- Name: expo_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expo_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    expo_token character varying(255) NOT NULL
);

--
-- Name: item_question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_question (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "shoppableId" uuid NOT NULL,
    title_sv text NOT NULL,
    title_en text,
    description_sv text NOT NULL,
    description_en text,
    type character varying(255) NOT NULL,
    "forExternalsOnly" boolean DEFAULT false NOT NULL,
    "removedAt" timestamp(3) without time zone
);

--
-- Name: item_question_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_question_option (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "questionId" uuid NOT NULL,
    answer_sv text NOT NULL,
    answer_en text,
    "extraPrice" integer
);

--
-- Name: item_question_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_question_response (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "questionId" uuid NOT NULL,
    "consumableId" uuid NOT NULL,
    answer text NOT NULL,
    "extraPrice" integer
);

--
-- Name: keycloak; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keycloak (
    keycloak_id character varying(255) NOT NULL,
    member_id uuid
);

--
-- Name: mandates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mandates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    position_id character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    "phadderInId" uuid,
    last_synced date NOT NULL
);

--
-- Name: markdowns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markdowns (
    name character varying(255) NOT NULL,
    markdown_sv text NOT NULL,
    markdown_en text
);

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    url character varying(255) NOT NULL
);

--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying(255),
    first_name character varying(255),
    nickname character varying(255),
    last_name character varying(255),
    picture_path text,
    class_programme character varying(255),
    class_year integer,
    visible boolean DEFAULT true NOT NULL,
    food_preference character varying(255),
    bio text,
    stripe_customer_id text,
    email character varying(255),
    nollning_group_id uuid,
    graduation_year integer,
    language character varying(255),
    birth_date date
);

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    link character varying(255) NOT NULL,
    read_at timestamp(6) with time zone,
    member_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    from_author_id uuid
);

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

--
-- Name: order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."order" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying(255) NOT NULL,
    payment_id uuid NOT NULL,
    total_price real NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);

--
-- Name: order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_inventory_id uuid NOT NULL,
    quantity integer NOT NULL,
    price real NOT NULL,
    discount_percentage real,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);

--
-- Name: payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying(255) NOT NULL,
    swish_id character varying(255) NOT NULL,
    payment_method character varying(255) NOT NULL,
    payment_status character varying(255) NOT NULL,
    payment_amount character varying(255) NOT NULL,
    payment_currency character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);

--
-- Name: phadder_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phadder_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    year integer NOT NULL,
    image_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: pings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_member uuid,
    to_member uuid,
    from_sent_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    to_sent_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    count integer DEFAULT 1
);

--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id character varying(255) NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255),
    committee_id uuid,
    email character varying(255),
    active boolean DEFAULT true NOT NULL,
    board_member boolean DEFAULT false NOT NULL,
    description_sv text,
    description_en text,
    end_month integer DEFAULT 11 NOT NULL,
    start_month integer DEFAULT 0 NOT NULL
);

--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    price integer NOT NULL,
    image_url text NOT NULL,
    category_id uuid NOT NULL,
    max_per_user integer DEFAULT 1000 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone,
    release_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: product_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_category (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);

--
-- Name: product_discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_discount (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    discount_percentage integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);

--
-- Name: product_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    product_discount_id uuid,
    quantity integer NOT NULL,
    variant character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);

--
-- Name: readme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.readme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    year integer NOT NULL,
    number integer NOT NULL,
    published_at timestamp(6) with time zone
);

--
-- Name: recurring_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    separation_count integer NOT NULL,
    recurring_type public."recurringType" NOT NULL,
    author_id uuid NOT NULL,
    start_datetime timestamp(6) with time zone NOT NULL,
    end_datetime timestamp(6) with time zone NOT NULL
);

--
-- Name: sexetinventoryvaluelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sexetinventoryvaluelog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    value integer NOT NULL
);

--
-- Name: shoppable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shoppable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_sv text NOT NULL,
    title_en text,
    description_sv text,
    description_en text,
    type public."ShoppableType" NOT NULL,
    "authorId" uuid NOT NULL,
    price integer NOT NULL,
    available_from timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    available_to timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    removed_at timestamp(6) with time zone
);

--
-- Name: shoppable_access_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shoppable_access_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "shoppableId" uuid NOT NULL,
    role text,
    student_id text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: song_book_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_book_entries (
    song_id uuid NOT NULL,
    page integer NOT NULL,
    number_on_page integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

--
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    lyrics text NOT NULL,
    melody character varying(255),
    category character varying(255),
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    slug character varying(255) NOT NULL,
    video text
);

--
-- Name: subscription_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    push_notification boolean DEFAULT false NOT NULL
);

--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_sv character varying(255) NOT NULL,
    name_en character varying(255),
    color character varying(255),
    is_default boolean DEFAULT false
);

--
-- Name: ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket (
    id uuid NOT NULL,
    "eventId" uuid NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "maxAmountPerUser" integer DEFAULT 1 NOT NULL
);

--
-- Name: ticket_queue_entry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_queue_entry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    release_id uuid NOT NULL,
    member_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    queue_position integer,
    offer_expires_at timestamp(6) with time zone,
    requested_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: ticket_release; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_release (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    quantity integer NOT NULL,
    opens_at timestamp(6) with time zone NOT NULL,
    grace_window_seconds integer DEFAULT 60 NOT NULL,
    offer_window_seconds integer DEFAULT 300 NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    event_id uuid NOT NULL,
    location text DEFAULT ''::text NOT NULL,
    closes_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL
);

--
-- Name: user_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);

--
-- Name: user_inventory_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_inventory_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_inventory_id uuid NOT NULL,
    product_inventory_id uuid NOT NULL,
    category_id uuid NOT NULL,
    student_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    image_url text NOT NULL,
    paid_price real NOT NULL,
    variant character varying(255),
    paid_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    consumed_at timestamp(6) with time zone,
    product_id uuid
);

--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);

--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("studentId");

--
-- Name: _alerts_closed_by _alerts_closed_by_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._alerts_closed_by
    ADD CONSTRAINT "_alerts_closed_by_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _article_likes _article_likes_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_likes
    ADD CONSTRAINT "_article_likes_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _article_tags _article_tags_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_tags
    ADD CONSTRAINT "_article_tags_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _booking_requests_access_doors _booking_requests_access_doors_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_doors
    ADD CONSTRAINT "_booking_requests_access_doors_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _booking_requests_access_members _booking_requests_access_members_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_members
    ADD CONSTRAINT "_booking_requests_access_members_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _booking_requests_bookables _booking_requests_bookables_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_bookables
    ADD CONSTRAINT "_booking_requests_bookables_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _event_going _event_going_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_going
    ADD CONSTRAINT "_event_going_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _event_interested _event_interested_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_interested
    ADD CONSTRAINT "_event_interested_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _event_tags _event_tags_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_tags
    ADD CONSTRAINT "_event_tags_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: _member_tag_subscriptions _member_tag_subscriptions_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._member_tag_subscriptions
    ADD CONSTRAINT "_member_tag_subscriptions_AB_pkey" PRIMARY KEY ("A", "B");

--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (key);

--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);

--
-- Name: api_access_policies api_access_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_access_policies
    ADD CONSTRAINT api_access_policies_pkey PRIMARY KEY (id);

--
-- Name: article_comments article_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_pkey PRIMARY KEY (id);

--
-- Name: article_requests article_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_requests
    ADD CONSTRAINT article_requests_pkey PRIMARY KEY (id);

--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);

--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);

--
-- Name: bookable_categories bookable_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookable_categories
    ADD CONSTRAINT bookable_categories_pkey PRIMARY KEY (id);

--
-- Name: bookables bookables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookables
    ADD CONSTRAINT bookables_pkey PRIMARY KEY (id);

--
-- Name: booking_requests booking_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_pkey PRIMARY KEY (id);

--
-- Name: cafe_shifts cafe_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_shifts
    ADD CONSTRAINT cafe_shifts_pkey PRIMARY KEY (id);

--
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (id);

--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);

--
-- Name: ciabatta_of_the_week ciabatta_of_the_week_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciabatta_of_the_week
    ADD CONSTRAINT ciabatta_of_the_week_pkey PRIMARY KEY (id);

--
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);

--
-- Name: consumable consumable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable
    ADD CONSTRAINT consumable_pkey PRIMARY KEY (id);

--
-- Name: consumable_reservation consumable_reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable_reservation
    ADD CONSTRAINT consumable_reservation_pkey PRIMARY KEY (id);

--
-- Name: custom_author_roles custom_author_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_author_roles
    ADD CONSTRAINT custom_author_roles_pkey PRIMARY KEY (id);

--
-- Name: custom_authors custom_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_authors
    ADD CONSTRAINT custom_authors_pkey PRIMARY KEY (id);

--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);

--
-- Name: door_access_policies door_access_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_access_policies
    ADD CONSTRAINT door_access_policies_pkey PRIMARY KEY (id);

--
-- Name: doors doors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doors
    ADD CONSTRAINT doors_pkey PRIMARY KEY (name);

--
-- Name: drinkitem drinkitem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drinkitem
    ADD CONSTRAINT drinkitem_pkey PRIMARY KEY (id);

--
-- Name: drinkitembatch drinkitembatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drinkitembatch
    ADD CONSTRAINT drinkitembatch_pkey PRIMARY KEY (id);

--
-- Name: elections elections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (id);

--
-- Name: event_comments event_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_comments
    ADD CONSTRAINT event_comments_pkey PRIMARY KEY (id);

--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);

--
-- Name: events_tags events_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events_tags
    ADD CONSTRAINT events_tags_pkey PRIMARY KEY (id);

--
-- Name: expense_items expense_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_pkey PRIMARY KEY (id);

--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);

--
-- Name: expo_tokens expo_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expo_tokens
    ADD CONSTRAINT expo_tokens_pkey PRIMARY KEY (id);

--
-- Name: item_question_option item_question_option_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question_option
    ADD CONSTRAINT item_question_option_pkey PRIMARY KEY (id);

--
-- Name: item_question item_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question
    ADD CONSTRAINT item_question_pkey PRIMARY KEY (id);

--
-- Name: item_question_response item_question_response_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question_response
    ADD CONSTRAINT item_question_response_pkey PRIMARY KEY (id);

--
-- Name: keycloak keycloak_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak
    ADD CONSTRAINT keycloak_pkey PRIMARY KEY (keycloak_id);

--
-- Name: email_aliases mail_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_aliases
    ADD CONSTRAINT mail_aliases_pkey PRIMARY KEY (id);

--
-- Name: mandates mandates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mandates
    ADD CONSTRAINT mandates_pkey PRIMARY KEY (id);

--
-- Name: markdowns markdowns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markdowns
    ADD CONSTRAINT markdowns_pkey PRIMARY KEY (name);

--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);

--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);

--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (id);

--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);

--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);

--
-- Name: phadder_groups phadder_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phadder_groups
    ADD CONSTRAINT phadder_groups_pkey PRIMARY KEY (id);

--
-- Name: pings pings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pings
    ADD CONSTRAINT pings_pkey PRIMARY KEY (id);

--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);

--
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (id);

--
-- Name: product_discount product_discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT product_discount_pkey PRIMARY KEY (id);

--
-- Name: product_inventory product_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_pkey PRIMARY KEY (id);

--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);

--
-- Name: readme readme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.readme
    ADD CONSTRAINT readme_pkey PRIMARY KEY (id);

--
-- Name: recurring_event recurring_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_event
    ADD CONSTRAINT recurring_event_pkey PRIMARY KEY (id);

--
-- Name: sexetinventoryvaluelog sexetinventoryvaluelog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sexetinventoryvaluelog
    ADD CONSTRAINT sexetinventoryvaluelog_pkey PRIMARY KEY (id);

--
-- Name: shoppable_access_policies shoppable_access_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shoppable_access_policies
    ADD CONSTRAINT shoppable_access_policies_pkey PRIMARY KEY (id);

--
-- Name: shoppable shoppable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shoppable
    ADD CONSTRAINT shoppable_pkey PRIMARY KEY (id);

--
-- Name: song_book_entries song_book_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_book_entries
    ADD CONSTRAINT song_book_entries_pkey PRIMARY KEY (page, number_on_page);

--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);

--
-- Name: subscription_settings subscription_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_settings
    ADD CONSTRAINT subscription_settings_pkey PRIMARY KEY (id);

--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (id);

--
-- Name: ticket_queue_entry ticket_queue_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_queue_entry
    ADD CONSTRAINT ticket_queue_entry_pkey PRIMARY KEY (id);

--
-- Name: ticket_release ticket_release_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_release
    ADD CONSTRAINT ticket_release_pkey PRIMARY KEY (id);

--
-- Name: user_inventory_item user_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory_item
    ADD CONSTRAINT user_inventory_item_pkey PRIMARY KEY (id);

--
-- Name: user_inventory user_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT user_inventory_pkey PRIMARY KEY (id);

--
-- Name: _alerts_closed_by_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_alerts_closed_by_B_index" ON public._alerts_closed_by USING btree ("B");

--
-- Name: _article_likes_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_article_likes_B_index" ON public._article_likes USING btree ("B");

--
-- Name: _article_tags_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_article_tags_B_index" ON public._article_tags USING btree ("B");

--
-- Name: _booking_requests_access_doors_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_booking_requests_access_doors_B_index" ON public._booking_requests_access_doors USING btree ("B");

--
-- Name: _booking_requests_access_members_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_booking_requests_access_members_B_index" ON public._booking_requests_access_members USING btree ("B");

--
-- Name: _booking_requests_bookables_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_booking_requests_bookables_B_index" ON public._booking_requests_bookables USING btree ("B");

--
-- Name: _event_going_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_event_going_B_index" ON public._event_going USING btree ("B");

--
-- Name: _event_interested_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_event_interested_B_index" ON public._event_interested USING btree ("B");

--
-- Name: _event_tags_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_event_tags_B_index" ON public._event_tags USING btree ("B");

--
-- Name: _member_tag_subscriptions_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_member_tag_subscriptions_B_index" ON public._member_tag_subscriptions USING btree ("B");

--
-- Name: article_requests_article_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX article_requests_article_id_unique ON public.article_requests USING btree (article_id);

--
-- Name: articles_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articles_slug_unique ON public.articles USING btree (slug);

--
-- Name: authors_member_id_mandate_id_custom_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX authors_member_id_mandate_id_custom_id_unique ON public.authors USING btree (member_id, mandate_id, custom_id);

--
-- Name: cart_item_product_inventory_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cart_item_product_inventory_id_key ON public.cart_item USING btree (product_inventory_id);

--
-- Name: committees_short_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX committees_short_name_key ON public.committees USING btree (short_name);

--
-- Name: date_timeslot_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX date_timeslot_unique ON public.cafe_shifts USING btree (date, time_slot);

--
-- Name: events_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX events_slug_unique ON public.events USING btree (slug);

--
-- Name: events_tags_event_id_tag_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX events_tags_event_id_tag_id_unique ON public.events_tags USING btree (event_id, tag_id);

--
-- Name: expo_tokens_expo_token_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX expo_tokens_expo_token_unique ON public.expo_tokens USING btree (expo_token);

--
-- Name: item_question_response_question_id_consumable_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX item_question_response_question_id_consumable_id_unique ON public.item_question_response USING btree ("questionId", "consumableId");

--
-- Name: meetings_url_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX meetings_url_key ON public.meetings USING btree (url);

--
-- Name: members_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX members_email_key ON public.members USING btree (email);

--
-- Name: members_student_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX members_student_id_unique ON public.members USING btree (student_id);

--
-- Name: payment_swish_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_swish_id_unique ON public.payment USING btree (swish_id);

--
-- Name: pings_from_member_to_member_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pings_from_member_to_member_unique ON public.pings USING btree (from_member, to_member);

--
-- Name: song_book_entries_song_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX song_book_entries_song_id_key ON public.song_book_entries USING btree (song_id);

--
-- Name: songs_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX songs_slug_unique ON public.songs USING btree (slug);

--
-- Name: subscription_settings_member_id_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscription_settings_member_id_type_key ON public.subscription_settings USING btree (member_id, type);

--
-- Name: ticket_queue_entry_release_id_member_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ticket_queue_entry_release_id_member_id_key ON public.ticket_queue_entry USING btree (release_id, member_id);

--
-- Name: user_inventory_student_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_inventory_student_id_unique ON public.user_inventory USING btree (student_id);

--
-- Name: week_year_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX week_year_unique ON public.ciabatta_of_the_week USING btree (year, week);

--
-- Name: _alerts_closed_by _alerts_closed_by_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._alerts_closed_by
    ADD CONSTRAINT "_alerts_closed_by_A_fkey" FOREIGN KEY ("A") REFERENCES public.alerts(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _alerts_closed_by _alerts_closed_by_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._alerts_closed_by
    ADD CONSTRAINT "_alerts_closed_by_B_fkey" FOREIGN KEY ("B") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _article_likes _article_likes_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_likes
    ADD CONSTRAINT "_article_likes_A_fkey" FOREIGN KEY ("A") REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _article_likes _article_likes_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_likes
    ADD CONSTRAINT "_article_likes_B_fkey" FOREIGN KEY ("B") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _article_tags _article_tags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_tags
    ADD CONSTRAINT "_article_tags_A_fkey" FOREIGN KEY ("A") REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _article_tags _article_tags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._article_tags
    ADD CONSTRAINT "_article_tags_B_fkey" FOREIGN KEY ("B") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_access_doors _booking_requests_access_doors_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_doors
    ADD CONSTRAINT "_booking_requests_access_doors_A_fkey" FOREIGN KEY ("A") REFERENCES public.booking_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_access_doors _booking_requests_access_doors_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_doors
    ADD CONSTRAINT "_booking_requests_access_doors_B_fkey" FOREIGN KEY ("B") REFERENCES public.doors(name) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_access_members _booking_requests_access_members_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_members
    ADD CONSTRAINT "_booking_requests_access_members_A_fkey" FOREIGN KEY ("A") REFERENCES public.booking_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_access_members _booking_requests_access_members_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_access_members
    ADD CONSTRAINT "_booking_requests_access_members_B_fkey" FOREIGN KEY ("B") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_bookables _booking_requests_bookables_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_bookables
    ADD CONSTRAINT "_booking_requests_bookables_A_fkey" FOREIGN KEY ("A") REFERENCES public.bookables(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _booking_requests_bookables _booking_requests_bookables_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._booking_requests_bookables
    ADD CONSTRAINT "_booking_requests_bookables_B_fkey" FOREIGN KEY ("B") REFERENCES public.booking_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_going _event_going_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_going
    ADD CONSTRAINT "_event_going_A_fkey" FOREIGN KEY ("A") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_going _event_going_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_going
    ADD CONSTRAINT "_event_going_B_fkey" FOREIGN KEY ("B") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_interested _event_interested_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_interested
    ADD CONSTRAINT "_event_interested_A_fkey" FOREIGN KEY ("A") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_interested _event_interested_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_interested
    ADD CONSTRAINT "_event_interested_B_fkey" FOREIGN KEY ("B") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_tags _event_tags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_tags
    ADD CONSTRAINT "_event_tags_A_fkey" FOREIGN KEY ("A") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _event_tags _event_tags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._event_tags
    ADD CONSTRAINT "_event_tags_B_fkey" FOREIGN KEY ("B") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _member_tag_subscriptions _member_tag_subscriptions_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._member_tag_subscriptions
    ADD CONSTRAINT "_member_tag_subscriptions_A_fkey" FOREIGN KEY ("A") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: _member_tag_subscriptions _member_tag_subscriptions_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._member_tag_subscriptions
    ADD CONSTRAINT "_member_tag_subscriptions_B_fkey" FOREIGN KEY ("B") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: api_access_policies access_policies_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_access_policies
    ADD CONSTRAINT access_policies_member_id_foreign FOREIGN KEY (student_id) REFERENCES public.members(student_id);

--
-- Name: shoppable_access_policies access_policies_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shoppable_access_policies
    ADD CONSTRAINT access_policies_member_id_foreign FOREIGN KEY (student_id) REFERENCES public.members(student_id);

--
-- Name: article_comments article_comments_article_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_article_id_foreign FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;

--
-- Name: article_comments article_comments_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: article_requests article_requests_article_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_requests
    ADD CONSTRAINT article_requests_article_id_foreign FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;

--
-- Name: article_requests article_requests_handled_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_requests
    ADD CONSTRAINT article_requests_handled_by_foreign FOREIGN KEY (handled_by) REFERENCES public.members(id) ON DELETE SET NULL;

--
-- Name: articles articles_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_foreign FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;

--
-- Name: articles articles_committee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_committee_id_foreign FOREIGN KEY (committee_id) REFERENCES public.committees(id);

--
-- Name: authors authors_custom_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_custom_id_foreign FOREIGN KEY (custom_id) REFERENCES public.custom_authors(id) ON DELETE SET NULL;

--
-- Name: authors authors_mandate_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_mandate_id_foreign FOREIGN KEY (mandate_id) REFERENCES public.mandates(id) ON DELETE SET NULL;

--
-- Name: authors authors_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: bookables bookables_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookables
    ADD CONSTRAINT bookables_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.bookable_categories(id);

--
-- Name: bookables bookables_door_name_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookables
    ADD CONSTRAINT bookables_door_name_foreign FOREIGN KEY (door) REFERENCES public.doors(name);

--
-- Name: booking_requests booking_requests_booker_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_booker_id_foreign FOREIGN KEY (booker_id) REFERENCES public.members(id);

--
-- Name: cart_item cart_item_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE;

--
-- Name: cart_item cart_item_product_inventory_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_product_inventory_id_foreign FOREIGN KEY (product_inventory_id) REFERENCES public.product_inventory(id) ON DELETE CASCADE;

--
-- Name: consumable consumable_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable
    ADD CONSTRAINT "consumable_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: consumable_reservation consumable_reservation_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable_reservation
    ADD CONSTRAINT "consumable_reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: consumable_reservation consumable_reservation_shoppableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable_reservation
    ADD CONSTRAINT "consumable_reservation_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES public.shoppable(id);

--
-- Name: consumable consumable_shoppableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumable
    ADD CONSTRAINT "consumable_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES public.shoppable(id);

--
-- Name: custom_author_roles custom_author_roles_custom_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_author_roles
    ADD CONSTRAINT custom_author_roles_custom_author_id_foreign FOREIGN KEY (custom_author_id) REFERENCES public.custom_authors(id) ON DELETE CASCADE;

--
-- Name: door_access_policies door_access_policies_booking_request_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_access_policies
    ADD CONSTRAINT door_access_policies_booking_request_id_foreign FOREIGN KEY (booking_request_id) REFERENCES public.booking_requests(id) ON DELETE CASCADE;

--
-- Name: door_access_policies door_access_policies_door_name_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_access_policies
    ADD CONSTRAINT door_access_policies_door_name_foreign FOREIGN KEY (door_name) REFERENCES public.doors(name);

--
-- Name: door_access_policies door_access_policies_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_access_policies
    ADD CONSTRAINT door_access_policies_member_id_foreign FOREIGN KEY (student_id) REFERENCES public.members(student_id);

--
-- Name: drinkitembatch drinkitembatch_drink_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drinkitembatch
    ADD CONSTRAINT drinkitembatch_drink_item_id_fkey FOREIGN KEY (drink_item_id) REFERENCES public.drinkitem(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: elections elections_committee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_committee_id_foreign FOREIGN KEY (committee_id) REFERENCES public.committees(id);

--
-- Name: email_aliases email_aliases_position_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_aliases
    ADD CONSTRAINT email_aliases_position_id_foreign FOREIGN KEY (position_id) REFERENCES public.positions(id);

--
-- Name: event_comments event_comments_event_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_comments
    ADD CONSTRAINT event_comments_event_id_foreign FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

--
-- Name: event_comments event_comments_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_comments
    ADD CONSTRAINT event_comments_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: events events_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_author_id_foreign FOREIGN KEY (author_id) REFERENCES public.members(id);

--
-- Name: recurring_event events_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_event
    ADD CONSTRAINT events_author_id_foreign FOREIGN KEY (author_id) REFERENCES public.members(id);

--
-- Name: events events_committee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_committee_id_foreign FOREIGN KEY (committee_id) REFERENCES public.committees(id);

--
-- Name: expense_items expense_item_expense_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_item_expense_id_foreign FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;

--
-- Name: expense_items expense_item_signed_by_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_item_signed_by_member_id_foreign FOREIGN KEY ("signedByMemberId") REFERENCES public.members(id);

--
-- Name: expense_items expense_item_signer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_item_signer_id_foreign FOREIGN KEY ("signerMemberId") REFERENCES public.members(id);

--
-- Name: expense_items expense_items_committeeShortName_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT "expense_items_committeeShortName_fkey" FOREIGN KEY ("committeeShortName") REFERENCES public.committees(short_name) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: expenses expense_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expense_member_id_foreign FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: expo_tokens expo_tokens_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expo_tokens
    ADD CONSTRAINT expo_tokens_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id);

--
-- Name: item_question_option item_question_option_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question_option
    ADD CONSTRAINT "item_question_option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.item_question(id) ON DELETE CASCADE;

--
-- Name: item_question_response item_question_response_consumableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question_response
    ADD CONSTRAINT "item_question_response_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES public.consumable(id) ON DELETE CASCADE;

--
-- Name: item_question_response item_question_response_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question_response
    ADD CONSTRAINT "item_question_response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.item_question(id) ON DELETE CASCADE;

--
-- Name: item_question item_question_shoppableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_question
    ADD CONSTRAINT "item_question_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES public.shoppable(id) ON DELETE CASCADE;

--
-- Name: mandates mandates_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mandates
    ADD CONSTRAINT mandates_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id);

--
-- Name: mandates mandates_phadderInId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mandates
    ADD CONSTRAINT "mandates_phadderInId_fkey" FOREIGN KEY ("phadderInId") REFERENCES public.phadder_groups(id) ON DELETE SET NULL;

--
-- Name: mandates mandates_position_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mandates
    ADD CONSTRAINT mandates_position_id_foreign FOREIGN KEY (position_id) REFERENCES public.positions(id);

--
-- Name: members members_nollning_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_nollning_group_id_foreign FOREIGN KEY (nollning_group_id) REFERENCES public.phadder_groups(id) ON DELETE SET NULL;

--
-- Name: notifications notifications_from_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_from_author_id_foreign FOREIGN KEY (from_author_id) REFERENCES public.authors(id) ON DELETE SET NULL;

--
-- Name: notifications notifications_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: order_item order_item_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON DELETE CASCADE;

--
-- Name: order_item order_item_product_inventory_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_product_inventory_id_foreign FOREIGN KEY (product_inventory_id) REFERENCES public.product_inventory(id) ON DELETE CASCADE;

--
-- Name: order order_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON DELETE CASCADE;

--
-- Name: pings pings_from_member_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pings
    ADD CONSTRAINT pings_from_member_foreign FOREIGN KEY (from_member) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: pings pings_to_member_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pings
    ADD CONSTRAINT pings_to_member_foreign FOREIGN KEY (to_member) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: positions positions_committee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_committee_id_foreign FOREIGN KEY (committee_id) REFERENCES public.committees(id);

--
-- Name: product product_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.product_category(id) ON DELETE CASCADE;

--
-- Name: product_inventory product_inventory_product_discount_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_product_discount_id_foreign FOREIGN KEY (product_discount_id) REFERENCES public.product_discount(id) ON DELETE CASCADE;

--
-- Name: product_inventory product_inventory_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE;

--
-- Name: events recurring_event_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT recurring_event_parent FOREIGN KEY (recurring_parent_id) REFERENCES public.recurring_event(id);

--
-- Name: shoppable_access_policies shoppable_access_policies_shoppableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shoppable_access_policies
    ADD CONSTRAINT "shoppable_access_policies_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES public.shoppable(id) ON DELETE CASCADE;

--
-- Name: shoppable shoppable_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shoppable
    ADD CONSTRAINT "shoppable_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.members(id);

--
-- Name: song_book_entries song_book_entries_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_book_entries
    ADD CONSTRAINT song_book_entries_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: subscription_settings subscription_settings_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_settings
    ADD CONSTRAINT subscription_settings_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

--
-- Name: ticket ticket_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT "ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id);

--
-- Name: ticket ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_fkey FOREIGN KEY (id) REFERENCES public.shoppable(id) ON DELETE CASCADE;

--
-- Name: ticket_queue_entry ticket_queue_entry_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_queue_entry
    ADD CONSTRAINT ticket_queue_entry_release_id_fkey FOREIGN KEY (release_id) REFERENCES public.ticket_release(id) ON DELETE CASCADE;

--
-- Name: ticket_release ticket_release_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_release
    ADD CONSTRAINT ticket_release_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);

--
-- Name: user_inventory_item user_inventory_item_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory_item
    ADD CONSTRAINT user_inventory_item_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.product_category(id) ON DELETE CASCADE;

--
-- Name: user_inventory_item user_inventory_item_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory_item
    ADD CONSTRAINT user_inventory_item_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE;

--
-- Name: user_inventory_item user_inventory_item_product_inventory_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory_item
    ADD CONSTRAINT user_inventory_item_product_inventory_id_foreign FOREIGN KEY (product_inventory_id) REFERENCES public.product_inventory(id) ON DELETE CASCADE;

--
-- Name: user_inventory_item user_inventory_item_user_inventory_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_inventory_item
    ADD CONSTRAINT user_inventory_item_user_inventory_id_foreign FOREIGN KEY (user_inventory_id) REFERENCES public.user_inventory(id) ON DELETE CASCADE;

--
-- Name: cafe_shifts worker_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cafe_shifts
    ADD CONSTRAINT worker_id_foreign FOREIGN KEY ("workerId") REFERENCES public.members(id);

--
--

