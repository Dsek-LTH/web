package db

import (
	"context"
	"fmt"
	"net/url"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool creates a connection pool and verifies it can reach the database.
func NewPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	dsn, err := NormalizeDSN(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}

// NormalizeDSN rewrites Prisma-style connection strings for pgx. Prisma
// encodes the target schema as a "schema" query param, which pgx forwards
// verbatim to Postgres as an unknown startup parameter and the server
// rejects; the real GUC for that is "search_path". Exported so cmd/migrate
// (a separate database/sql-based connection, not pgx, but hitting the same
// Postgres) can apply the same rewrite.
func NormalizeDSN(dsn string) (string, error) {
	u, err := url.Parse(dsn)
	if err != nil {
		return "", err
	}

	q := u.Query()
	if schema := q.Get("schema"); schema != "" {
		q.Del("schema")
		if q.Get("search_path") == "" {
			q.Set("search_path", schema)
		}
	}
	u.RawQuery = q.Encode()

	return u.String(), nil
}
