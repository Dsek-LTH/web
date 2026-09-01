// Command migrate applies backend/internal/db/migrations against POSTGRES_URL.
//
// This is a deliberately minimal wrapper around the golang-migrate library,
// not the stock golang-migrate/migrate/v4/cmd/migrate binary: that binary's
// database/source drivers are selected via build tags (-tags postgres,file),
// and `go tool <name>` (this project's convention for invoking tool
// dependencies, see go.mod's tool block) has no way to pass build tags to
// the underlying build. Importing exactly the two drivers this project
// needs, unconditionally, sidesteps that - and avoids go.sum picking up
// every optional driver (mongodb, cassandra, spanner, ...) the stock binary
// supports, which is what a plain `go get -tool .../cmd/migrate` does.
//
// Usage (run from backend/, matching every other `go tool`/`go run` command
// in this repo):
//
//	go tool migrate up
//	go tool migrate down [n]
//	go tool migrate force <version>
//	go tool migrate version
package main

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/backend/internal/db"
)

const migrationsPath = "file://internal/db/migrations"

func main() {
	if len(os.Args) < 2 {
		usageAndExit()
	}

	// Mirrors main.go's own env loading: prefer backend/.env, fall back to
	// the SvelteKit app's ../.env so both backends share dev credentials.
	if err := godotenv.Load(".env"); err != nil {
		_ = godotenv.Load("../.env")
	}

	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		log.Fatal("POSTGRES_URL is not set")
	}
	dsn, err := db.NormalizeDSN(dsn)
	if err != nil {
		log.Fatalf("normalize POSTGRES_URL: %v", err)
	}
	dsn, err = defaultSSLMode(dsn)
	if err != nil {
		log.Fatalf("normalize POSTGRES_URL: %v", err)
	}

	m, err := migrate.New(migrationsPath, dsn)
	if err != nil {
		log.Fatalf("init migrate: %v", err)
	}
	defer m.Close()

	switch cmd, args := os.Args[1], os.Args[2:]; cmd {
	case "up":
		err = m.Up()
	case "down":
		steps := 1
		if len(args) > 0 {
			steps, err = strconv.Atoi(args[0])
			if err != nil {
				log.Fatalf("invalid step count %q: %v", args[0], err)
			}
		}
		err = m.Steps(-steps)
	case "force":
		if len(args) != 1 {
			usageAndExit()
		}
		version, convErr := strconv.Atoi(args[0])
		if convErr != nil {
			log.Fatalf("invalid version %q: %v", args[0], convErr)
		}
		err = m.Force(version)
	case "version":
		version, dirty, vErr := m.Version()
		if vErr != nil {
			err = vErr
			break
		}
		fmt.Printf("%d (dirty=%v)\n", version, dirty)
	default:
		usageAndExit()
	}

	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatal(err)
	}
}

// defaultSSLMode fills in sslmode=prefer when the DSN doesn't specify one.
// pgx (used by the rest of this backend, via internal/db/pool.go) defaults
// to "prefer" when sslmode is unset, so it connects fine to a plain local
// Postgres with no SSL configured. lib/pq - what migrate's postgres driver
// uses under the hood - defaults to "require" instead, which fails against
// that same local server ("SSL is not enabled on the server"). Only
// cmd/migrate's own DSN is adjusted here; internal/db.NormalizeDSN (shared
// with the pgx pool) is left alone.
func defaultSSLMode(dsn string) (string, error) {
	u, err := url.Parse(dsn)
	if err != nil {
		return "", err
	}
	q := u.Query()
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "prefer")
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func usageAndExit() {
	fmt.Fprintln(os.Stderr, "usage: go tool migrate up|down [n]|force <version>|version")
	os.Exit(2)
}
