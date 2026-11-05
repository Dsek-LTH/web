// Command seed fills a local development database with fake data (see
// internal/seed). It wipes the database first, so it refuses to run against
// anything but a local database, or while an SSH tunnel to a PostgreSQL
// port is open (which would make a remote database look local).
//
// Usage, from backend/ (after `go tool migrate up`):
//
//	go tool seed
package main

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"strings"

	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/backend/internal/db"
	"github.com/dsek-lth/web/apps/backend/internal/seed"
)

func main() {
	_ = godotenv.Load(".env")
	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		log.Fatal("POSTGRES_URL is not set")
	}
	if err := checkLocal(dsn); err != nil {
		log.Fatalf("refusing to seed: %v", err)
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	if err := seed.Run(ctx, pool); err != nil {
		log.Fatalf("seed: %v", err)
	}
	log.Println("seeded")
}

var localHosts = map[string]bool{
	"localhost": true,
	"127.0.0.1": true,
	"::1":       true,
	"dsek-db":   true,
	"db":        true,
}

// checkLocal makes sure dsn points at a local database, and that the local
// port isn't an SSH tunnel to some other machine's database (the old seed's
// check). Lima/colima's own SSH port forwarding into its Docker VM looks
// the same from here, so that one is allowed.
func checkLocal(dsn string) error {
	u, err := url.Parse(dsn)
	if err != nil {
		return fmt.Errorf("parse POSTGRES_URL: %w", err)
	}
	if !localHosts[u.Hostname()] {
		return fmt.Errorf("POSTGRES_URL points at %q, not a local database", u.Hostname())
	}
	port := u.Port()
	if port == "" {
		port = "5432"
	}
	out, _ := exec.Command("lsof", "-nP", "-iTCP:"+port, "-sTCP:LISTEN").
		Output()
		// no lsof: nothing to check
	for _, line := range strings.Split(string(out), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || fields[0] != "ssh" {
			continue
		}
		command, _ := exec.Command("ps", "-o", "command=", "-p", fields[1]).Output()
		if strings.Contains(string(command), "/_lima/") {
			continue
		}
		return fmt.Errorf("port %s is an SSH tunnel - you may be connected to production", port)
	}
	return nil
}
