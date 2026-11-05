// Package seed fills a database with deterministic fake development data,
// and grants every policy in internal/apinames to everyone (role "*") so all
// of the site can be tried out. It wipes the database first (every table
// except the migration bookkeeping). The seed command (cmd/seed) only runs
// it against a local database; tests run it on their own throwaway one.
package seed

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/committees"
	"github.com/dsek-lth/web/apps/api/internal/notifications"
	"github.com/dsek-lth/web/apps/api/internal/slug"
)

//go:embed pages/for-foretag.sv.md
var forForetagSv string

//go:embed pages/for-foretag.en.md
var forForetagEn string

// randomSeed makes every run produce the same data.
const randomSeed = 1

// Run wipes the database behind pool and fills it, in one transaction. The
// data is deterministic: the same seed gives the same database. $USER is
// created as a member too, so logging in as yourself works.
func Run(ctx context.Context, pool *pgxpool.Pool) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // a no-op after Commit

	s := &seeder{ctx: ctx, tx: tx, f: gofakeit.New(randomSeed), now: time.Now()}
	if err := s.run(); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

type seeder struct {
	ctx context.Context
	tx  pgx.Tx
	f   *gofakeit.Faker
	now time.Time

	tagIDs       []string
	memberIDs    []string
	studentIDs   []string
	committeeIDs map[string]string // short name -> id
	positionIDs  []string
	bookableIDs  []string
	slugCounts   map[string]int
}

func (s *seeder) exec(sql string, args ...any) error {
	_, err := s.tx.Exec(s.ctx, sql, args...)
	return err
}

func (s *seeder) insertID(sql string, args ...any) (string, error) {
	var id string
	err := s.tx.QueryRow(s.ctx, sql, args...).Scan(&id)
	return id, err
}

func (s *seeder) run() error {
	steps := []struct {
		name string
		fn   func() error
	}{
		{"wipe", s.wipe},
		{"tags", s.tags},
		{"members", s.members},
		{"committees", s.committees},
		{"nollning season", s.nollningSeason},
		{"articles", s.articles},
		{"events", s.events},
		{"access policies", s.accessPolicies},
		{"doors", s.doors},
		{"bookings", s.bookings},
		{"governing documents", s.governingDocuments},
		{"markdowns", s.markdowns},
		{"songs", s.songs},
		{"subscription settings", s.subscriptionSettings},
		{"elections", s.elections},
		{"readme", s.readme},
	}
	for _, step := range steps {
		if err := step.fn(); err != nil {
			return fmt.Errorf("%s: %w", step.name, err)
		}
	}
	return nil
}

// wipe empties every table except the migration bookkeeping.
func (s *seeder) wipe() error {
	rows, err := s.tx.Query(s.ctx, `
		SELECT quote_ident(tablename) FROM pg_tables
		WHERE schemaname = current_schema()
		  AND tablename NOT IN ('schema_migrations', '_prisma_migrations')`)
	if err != nil {
		return err
	}
	tables, err := pgx.CollectRows(rows, pgx.RowTo[string])
	if err != nil {
		return err
	}
	if len(tables) == 0 {
		return fmt.Errorf("no tables - run `go tool migrate up` first")
	}
	return s.exec("TRUNCATE " + strings.Join(tables, ", ") + " RESTART IDENTITY CASCADE")
}

// uniqueSlug mirrors how the services number repeated slugs.
func (s *seeder) uniqueSlug(title string) string {
	if s.slugCounts == nil {
		s.slugCounts = map[string]int{}
	}
	base := slug.Slugify(title)
	n := s.slugCounts[base]
	s.slugCounts[base]++
	return slug.SlugWithCount(base, n)
}

func (s *seeder) paragraphs(minCount, maxCount int) string {
	n := s.f.IntRange(minCount, maxCount)
	ps := make([]string, n)
	for i := range ps {
		ps[i] = s.f.Paragraph(1, s.f.IntRange(3, 6), 12, "")
	}
	return strings.Join(ps, "\n\n")
}

func (s *seeder) randomMember() string  { return s.memberIDs[s.f.IntN(len(s.memberIDs))] }
func (s *seeder) randomStudent() string { return s.studentIDs[s.f.IntN(len(s.studentIDs))] }

func (s *seeder) pastDate(maxDays int) time.Time {
	return s.now.Add(-time.Duration(s.f.IntRange(1, maxDays*24)) * time.Hour)
}

func (s *seeder) futureDate(maxDays int) time.Time {
	return s.now.Add(time.Duration(s.f.IntRange(1, maxDays*24)) * time.Hour)
}

func (s *seeder) tags() error {
	for range 10 {
		id, err := s.insertID(
			`INSERT INTO tags (name_sv, name_en, color) VALUES ($1, $2, $3) RETURNING id`,
			s.f.Word(), s.f.Word(), s.f.HexColor(),
		)
		if err != nil {
			return err
		}
		s.tagIDs = append(s.tagIDs, id)
	}
	return nil
}

func (s *seeder) members() error {
	studentIDs := []string{}
	if user := os.Getenv("USER"); user != "" {
		studentIDs = append(studentIDs, user)
	}
	seen := map[string]bool{}
	for len(studentIDs) < 101 {
		first, last := s.f.FirstName(), s.f.LastName()
		studentID := strings.ToLower(
			fmt.Sprintf("%.2s%04d%.2s-s", first, s.f.IntRange(1000, 9999), last),
		)
		if seen[studentID] {
			continue
		}
		seen[studentID] = true
		studentIDs = append(studentIDs, studentID)
	}

	for _, studentID := range studentIDs {
		first, last := s.f.FirstName(), s.f.LastName()
		var nickname, bio, food *string
		if s.f.Bool() {
			v := s.f.Adjective()
			nickname = &v
		}
		if s.f.Bool() {
			v := s.f.Sentence(12)
			bio = &v
		}
		if s.f.IntN(4) == 0 {
			v := s.f.RandomString([]string{"Vegetarian", "Vegan"})
			food = &v
		}
		// About one in ten has their birthday today, so the home page's
		// birthday list has someone to show.
		birthDate := time.Date(
			s.f.IntRange(s.now.Year()-30, s.now.Year()-18),
			time.Month(s.f.IntRange(1, 12)), s.f.IntRange(1, 28), 0, 0, 0, 0, time.UTC,
		)
		if s.f.IntN(10) == 0 {
			birthDate = time.Date(
				s.f.IntRange(1995, 2005), s.now.Month(), s.now.Day(), 0, 0, 0, 0, time.UTC,
			)
		}
		email := strings.ToLower(fmt.Sprintf("%s.%s.%s@user.dsek.se", first, last, studentID))
		id, err := s.insertID(
			`
			INSERT INTO members (student_id, first_name, last_name, nickname, bio, food_preference,
				class_programme, class_year, picture_path, email, birth_date, visible)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING id`,
			studentID,
			first,
			last,
			nickname,
			bio,
			food,
			s.f.RandomString([]string{"C", "D"}),
			s.f.IntRange(s.now.Year()-6, s.now.Year()),
			fmt.Sprintf(
				"https://avatars.githubusercontent.com/u/%d",
				s.f.IntRange(1_000_000, 99_999_999),
			),
			email,
			birthDate.Format(time.DateOnly),
		)
		if err != nil {
			return err
		}
		s.memberIDs = append(s.memberIDs, id)
		s.studentIDs = append(s.studentIDs, studentID)
	}
	return nil
}

var committeeList = []struct{ nameSv, shortName string }{
	{"Skattmästeriet", "skattm"},
	{"Informationsutskottet", "infu"},
	{"Studierådet", "srd"},
	{"Cafémästeriet", "cafe"},
	{"Näringslivsutskottet", "naru"},
	{"Källarmästeriet", "km"},
	{"Aktivitetsutskottet", "aktu"},
	{"Sexmästeriet", "sexm"},
	{"Nollningsutskottet", "nollu"},
	{"Framtidsutskottet", "fram"},
	{"D-chip", "dchip"},
	{"Medaljelelekommittén", "medalj"},
	{"Trivselrådet", "trivsel"},
	{"Valberedningen", "valb"},
	{"Tackmästeriet", "tackm"},
	{"Centralprocessutskottet", "cpu"},
	{"Övriga förtroendevalda", "other"},
}

// committees creates every committee with its real positions, each with
// one to five mandates (past ones and current ones).
func (s *seeder) committees() error {
	const logos = "https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/"
	board := map[string]bool{}
	for _, id := range committees.BoardPositionIDs() {
		board[id] = true
	}
	s.committeeIDs = map[string]string{}
	created := map[string]bool{}
	for _, c := range committeeList {
		base := logos + c.shortName + "/SVG/"
		id, err := s.insertID(`
			INSERT INTO committees (name_sv, short_name, light_image_url, dark_image_url,
				mono_image_url, symbol_url)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
			c.nameSv, c.shortName, base+"full/light.svg", base+"full/dark.svg",
			base+"full/bw.svg", base+"symbol/dark.svg",
		)
		if err != nil {
			return err
		}
		s.committeeIDs[c.shortName] = id

		for _, positionID := range committees.CommitteePositionIDs(c.shortName) {
			if created[positionID] {
				continue
			}
			created[positionID] = true
			name := s.f.JobTitle()
			if err := s.exec(`
				INSERT INTO positions (id, name_sv, name_en, committee_id, email, description_sv,
					board_member, active)
				VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
				positionID, name, name, id,
				strings.ReplaceAll(strings.TrimPrefix(positionID, "dsek."), ".", "-")+"@dsek.se",
				s.f.Paragraph(1, 3, 12, ""), board[positionID],
			); err != nil {
				return err
			}
			s.positionIDs = append(s.positionIDs, positionID)

			for i := range s.f.IntRange(1, 5) {
				// The first mandate is this year's; the rest are earlier years'.
				year := s.now.Year() - i
				if err := s.exec(`
					INSERT INTO mandates (member_id, position_id, start_date, end_date, last_synced)
					VALUES ($1, $2, $3, $4, $5)`,
					s.randomMember(), positionID,
					time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC),
					time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC), s.now,
				); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// nollningSeason adds this year's season, organized by nollu, so the
// nollning pages have something to show.
func (s *seeder) nollningSeason() error {
	y := s.now.Year()
	return s.exec(`
		INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at, organizing_committee_id)
		VALUES ($1, $2, $3, $4, $5)`,
		y,
		time.Date(y, 8, 18, 0, 0, 0, 0, time.UTC),
		time.Date(y, 8, 25, 0, 0, 0, 0, time.UTC),
		time.Date(y, 10, 1, 0, 0, 0, 0, time.UTC),
		s.committeeIDs["nollu"],
	)
}

func (s *seeder) articles() error {
	authors := map[string]string{} // member id -> author id
	var articleIDs []string
	for range 100 {
		memberID := s.randomMember()
		authorID, ok := authors[memberID]
		if !ok {
			var err error
			authorID, err = s.insertID(
				`INSERT INTO authors (member_id) VALUES ($1) RETURNING id`,
				memberID,
			)
			if err != nil {
				return err
			}
			authors[memberID] = authorID
		}
		header := strings.TrimSuffix(s.f.Sentence(6), ".")
		published := s.pastDate(365)
		var imageURL *string
		if s.f.Bool() {
			v := fmt.Sprintf("https://picsum.photos/seed/%d/800/450", s.f.IntRange(1, 1_000_000))
			imageURL = &v
		}
		// announced_at is set so the announcement sweep doesn't notify
		// everyone about a hundred seeded articles.
		id, err := s.insertID(`
			INSERT INTO articles (header_sv, body_sv, slug, author_id, image_url,
				created_datetime, published_datetime, announced_at)
			VALUES ($1, $2, $3, $4, $5, $6, $6, $6) RETURNING id`,
			header, s.paragraphs(3, 10), s.uniqueSlug(header), authorID, imageURL, published,
		)
		if err != nil {
			return err
		}
		articleIDs = append(articleIDs, id)
		for _, tagID := range s.pick(s.tagIDs, s.f.IntRange(0, 3)) {
			if err := s.exec(
				`INSERT INTO _article_tags ("A", "B") VALUES ($1, $2)`,
				id,
				tagID,
			); err != nil {
				return err
			}
		}
	}
	for range 10 {
		if err := s.exec(
			`
			INSERT INTO article_comments (article_id, member_id, content, published)
			VALUES ($1, $2, $3, $4)`,
			articleIDs[s.f.IntN(len(articleIDs))],
			s.randomMember(),
			s.f.Sentence(8),
			s.pastDate(30),
		); err != nil {
			return err
		}
	}
	return nil
}

// pick returns n distinct elements of items.
func (s *seeder) pick(items []string, n int) []string {
	shuffled := append([]string(nil), items...)
	s.f.ShuffleStrings(shuffled)
	return shuffled[:min(n, len(shuffled))]
}

func (s *seeder) events() error {
	for range 50 {
		title := strings.TrimSuffix(s.f.Sentence(5), ".")
		start := s.futureDate(60)
		if s.f.Bool() {
			start = s.pastDate(60)
		}
		end := start.Add(time.Duration(s.f.IntRange(1, 5)) * time.Hour)
		committee := committeeList[s.f.IntN(len(committeeList))]
		if err := s.exec(
			`
			INSERT INTO events (title_sv, description_sv, short_description_sv, organizer, author_id,
				start_datetime, end_datetime, slug, location, committee_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			title,
			s.paragraphs(3, 6),
			s.f.Sentence(8),
			committee.nameSv,
			s.randomMember(),
			start,
			end,
			s.uniqueSlug(title),
			s.f.RandomString([]string{"iDét", "E:A", "Edekvata", "Gasque"}),
			s.committeeIDs[committee.shortName],
		); err != nil {
			return err
		}
	}
	return nil
}

// accessPolicies grants every policy Go checks to everyone, so every part
// of the site can be tried out locally.
func (s *seeder) accessPolicies() error {
	for _, name := range apinames.All() {
		if err := s.exec(
			`INSERT INTO api_access_policies (api_name, role) VALUES ($1, '*')`,
			name,
		); err != nil {
			return err
		}
	}
	return nil
}

var doorList = []struct{ name, verboseName string }{
	{"border", "Border"},
	{"ful", "Fulförrådet"},
	{"buren", "Buren"},
	{"idet", "iDét"},
	{"koket", "Köket"},
	{"komitea", "Komitea"},
	{"mauer", "Mauer (caféförrådet)"},
	{"sex", "Sexförrådet"},
	{"stad", "Städförrådet"},
	{"styrelserummet", "Råsenbad (styrelserummet)"},
	{"utskott", "Utskott"},
}

func (s *seeder) doors() error {
	for _, d := range doorList {
		if err := s.exec(
			`INSERT INTO doors (name, verbose_name) VALUES ($1, $2)`,
			d.name,
			d.verboseName,
		); err != nil {
			return err
		}
	}
	for range 50 {
		door := doorList[s.f.IntN(len(doorList))].name
		var role, studentID *string
		if s.f.Bool() {
			v := s.positionIDs[s.f.IntN(len(s.positionIDs))]
			role = &v
		} else {
			v := s.randomStudent()
			studentID = &v
		}
		var start, end *time.Time
		if s.f.Bool() {
			v := s.pastDate(365)
			start = &v
			if s.f.Bool() {
				e := s.futureDate(365)
				end = &e
			}
		}
		if err := s.exec(`
			INSERT INTO door_access_policies (door_name, role, student_id, start_datetime, end_datetime, information)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			door, role, studentID, start, end, s.f.Sentence(5),
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) bookings() error {
	bookables := []struct{ nameSv, id string }{
		{"Uppehållsdelen av iDét", ""},
		{"Köket", ""},
		{"Filmkamera", ""},
		{"Lysrör", ""},
		{"Sektionsbilen", ""},
		{"Lila Soundboks", ""},
		{"Råsa Soundboks", ""},
		// A fixed id, like the old seed (some links point at it).
		{"Styrelserummet", "99854837-fdb9-4dba-85fc-86a5c514253c"},
	}
	for _, b := range bookables {
		id, err := s.insertID(`
			INSERT INTO bookables (id, name_sv) VALUES (COALESCE(NULLIF($1, '')::uuid, gen_random_uuid()), $2)
			RETURNING id`, b.id, b.nameSv)
		if err != nil {
			return err
		}
		s.bookableIDs = append(s.bookableIDs, id)
	}
	for range 25 {
		start := s.futureDate(60)
		id, err := s.insertID(`
			INSERT INTO booking_requests (booker_id, start, "end", event, status)
			VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			s.randomMember(), start, start.Add(time.Duration(s.f.IntRange(1, 5))*time.Hour),
			s.f.Sentence(4), s.f.RandomString([]string{"PENDING", "ACCEPTED", "DENIED"}),
		)
		if err != nil {
			return err
		}
		for _, bookableID := range s.pick(s.bookableIDs, s.f.IntRange(1, 5)) {
			if err := s.exec(
				`INSERT INTO _booking_requests_bookables ("A", "B") VALUES ($1, $2)`,
				bookableID,
				id,
			); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *seeder) governingDocuments() error {
	policies := []string{
		"Policy för hantering av personuppgifter", "Policy för jämlikhet", "Policy för mötestider",
		"Policy för röstning", "Policy för samverkan med D-Chip", "Policy för sektionsbil",
		"Policy för styrdokument", "Policy för tackverksamhet", "Policy för val",
		"Policy för valberedningens arbete", "Policy för Alkohol och Droger", "Policy för Ekonomi",
	}
	guidelines := []string{
		"Riktlinje för dansplattor",
		"Riktlinje för engelska titlar",
		"Riktlinje för grafisk profil",
		"Riktlinje för hantering av sektionens Facebooksidor",
		"Riktlinje för marknadsföring och prissättning",
		"Riktlinje för överlämning",
		"Riktlinje för sektionsbilens användning",
		"Riktlinje för anmodan och inbjudningar",
		"Strategisk plan",
	}
	insert := func(title, docType string) error {
		return s.exec(`INSERT INTO documents (title, url, type) VALUES ($1, $2, $3)`,
			title, "policys/releases/download/latest/"+slug.Slugify(title)+".pdf", docType)
	}
	for _, t := range policies {
		if err := insert(t, "POLICY"); err != nil {
			return err
		}
	}
	for _, t := range guidelines {
		if err := insert(t, "GUIDELINE"); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) markdowns() error {
	insert := func(name, sv, en string) error {
		return s.exec(
			`INSERT INTO markdowns (name, markdown_sv, markdown_en) VALUES ($1, $2, $3)`,
			name,
			sv,
			en,
		)
	}
	// Each committee's about text, and the info pages the site links to.
	names := []string{
		"hjalp", "privacy-policy", "access", "for-companies", "benefits", "sektionspub",
		"htm1", "readme", "dkontakt", "sight", "contact", "familjefoto",
	}
	for _, c := range committeeList {
		names = append(names, c.shortName)
	}
	for _, name := range names {
		if err := insert(name, s.paragraphs(3, 6), s.paragraphs(3, 6)); err != nil {
			return err
		}
	}
	minio := strings.TrimSuffix(os.Getenv("PUBLIC_MINIO_BASE_URL"), "/")
	if err := insert("for-foretag",
		strings.ReplaceAll(forForetagSv, "{{MINIO_BASE_URL}}", minio),
		strings.ReplaceAll(forForetagEn, "{{MINIO_BASE_URL}}", minio),
	); err != nil {
		return err
	}
	if err := insert("cafe_links", "[Jobbarschema](/committees/cafe/schedule)",
		"[Worker schedule](/committees/cafe/schedule)"); err != nil {
		return err
	}
	if err := insert("nollu_links", "[Phaddergrupper](/committees/nollu/groups)",
		"[Mentor groups](/committees/nollu/groups)"); err != nil {
		return err
	}
	// Cafe opening hours, Monday (0) to Friday (4).
	for day := range 5 {
		if err := insert(
			fmt.Sprintf("cafe:open:%d", day),
			"11:30 - 13:00",
			"11:30 - 13:00",
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) songs() error {
	for range 50 {
		title := s.f.SongName()
		created := s.pastDate(1000)
		if err := s.exec(
			`
			INSERT INTO songs (title, slug, lyrics, melody, category, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $6)`,
			title,
			s.uniqueSlug(title),
			s.paragraphs(3, 6),
			s.f.SongName(),
			s.f.SongGenre(),
			created,
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) subscriptionSettings() error {
	types := notifications.AllSettingTypes
	for range 100 {
		if err := s.exec(`
			INSERT INTO subscription_settings (member_id, type, push_notification)
			VALUES ($1, $2, $3) ON CONFLICT (member_id, type) DO NOTHING`,
			s.randomMember(), string(types[s.f.IntN(len(types))]), s.f.Bool(),
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) elections() error {
	for range 5 {
		committee := committeeList[s.f.IntN(len(committeeList))]
		bullets := func() string {
			lines := make([]string, s.f.IntRange(3, 7))
			for i := range lines {
				lines[i] = "- " + s.f.Sentence(8)
			}
			return strings.Join(lines, "\n")
		}
		if err := s.exec(`
			INSERT INTO elections (committee_id, markdown_sv, markdown_en, link, created_at, expires_at)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			s.committeeIDs[committee.shortName], bullets(), bullets(), s.f.URL(),
			s.pastDate(14), s.futureDate(14),
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) readme() error {
	for number := 1; number <= 5; number++ {
		published := s.pastDate(300)
		if err := s.exec(`
			INSERT INTO readme (title, url, year, number, published_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $5)`,
			fmt.Sprintf("README #%d", number),
			"https://publuu.com/flip-book/782891/1741481/page/1?embed",
			s.now.Year(), number, published,
		); err != nil {
			return err
		}
	}
	return nil
}
