// Package stocklist is the cafe drink-inventory domain behind
// admin/stocklist - DrinkItem (products) and DrinkItemBatch (stock-change
// log entries), see DESIGN.md's roadmap Phase 11 ("Admin consolidation").
// This is the "drink inventory" half of the roadmap's original Phase 8
// ("shifts + drink inventory") description, deliberately deferred out of
// that phase to here - see internal/cafe's own doc comment and
// backend/CLAUDE.md's Cafe routes section for the user-confirmed scope
// correction. SexetInventoryValueLog (also named in that original
// description) is confirmed dead - no real caller anywhere in the old app
// beyond the generic Prisma-REST schema dump - and isn't ported.
package stocklist

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

var (
	ErrNotFound     = errors.New("stocklist: not found")
	ErrInvalidInput = errors.New("stocklist: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, queries: db.New(pool)}
}

func toDrinkItem(row db.Drinkitem) DrinkItem {
	return DrinkItem{
		ID:                dbutil.UUIDStr(row.ID),
		QuantityType:      string(row.QuantityType),
		Name:              row.Name,
		Price:             row.Price,
		Group:             string(row.Group),
		SystembolagetID:   row.SystembolagetID,
		BottleEmptyWeight: dbutil.Int4Ptr(row.BottleEmptyWeight),
		BottleFullWeight:  dbutil.Int4Ptr(row.BottleFullWeight),
		QuantityAvailable: row.QuantityAvailable.Int32,
		NrBottles:         row.NrBottles.Int32,
	}
}

// List is a public read (matches the old ZModel's @@allow("read", true) -
// no authorize() call in either the main stocklist page or showproducts).
// availableOnly matches the main page's `quantityAvailable: {gt: 0}`
// filter; showproducts wants every item regardless of stock level.
func (s *Service) List(ctx context.Context, availableOnly bool) ([]DrinkItem, error) {
	var rows []db.Drinkitem
	var err error
	if availableOnly {
		rows, err = s.queries.ListAvailableDrinkItems(ctx)
	} else {
		rows, err = s.queries.ListDrinkItems(ctx)
	}
	if err != nil {
		return nil, fmt.Errorf("list drink items: %w", err)
	}
	out := make([]DrinkItem, len(rows))
	for i, row := range rows {
		out[i] = toDrinkItem(row)
	}
	return out, nil
}

// InventoryValue is a verbatim port of stocklistUtils.ts's inventoryValue -
// COUNTS items value at price*quantity; WEIGHT items value the remaining
// liquid (quantityAvailable minus the bottles' own tare weight) as a
// fraction of one full bottle's liquid weight, skipped entirely if either
// weight bound is 0 (division-by-zero guard the old code also had).
func (s *Service) InventoryValue(ctx context.Context) (float64, error) {
	rows, err := s.queries.ListAvailableDrinkItems(ctx)
	if err != nil {
		return 0, fmt.Errorf("inventory value: %w", err)
	}
	var value float64
	for _, row := range rows {
		available := row.QuantityAvailable.Int32
		switch row.QuantityType {
		case db.DrinkQuantityTypeCOUNTS:
			value += (float64(row.Price) / 100) * float64(available)
		case db.DrinkQuantityTypeWEIGHT:
			emptyW, fullW := row.BottleEmptyWeight.Int32, row.BottleFullWeight.Int32
			if !row.BottleEmptyWeight.Valid || emptyW == 0 || !row.BottleFullWeight.Valid ||
				fullW == 0 {
				continue
			}
			liquidWeight := float64(available) - float64(row.NrBottles.Int32)*float64(emptyW)
			bottlePrice := float64(row.Price) / 100
			fullBottleLiquidWeight := float64(fullW - emptyW)
			value += (liquidWeight / fullBottleLiquidWeight) * bottlePrice
		}
	}
	return value, nil
}

func (s *Service) Create(ctx context.Context, in DrinkItemCreateInput) (*DrinkItem, error) {
	if err := auth.Require(ctx, apinames.DrinkItemCreate); err != nil {
		return nil, err
	}
	row, err := s.queries.CreateDrinkItem(ctx, db.CreateDrinkItemParams{
		QuantityType:      db.DrinkQuantityType(in.QuantityType),
		Name:              in.Name,
		Price:             int32(in.PriceKr * 100),
		Group:             db.DrinkGroup(in.Group),
		SystembolagetID:   in.SystembolagetID,
		BottleEmptyWeight: dbutil.ToInt4(in.BottleEmptyWeight),
		BottleFullWeight:  dbutil.ToInt4(in.BottleFullWeight),
	})
	if err != nil {
		return nil, fmt.Errorf("create drink item: %w", err)
	}
	out := toDrinkItem(row)
	return &out, nil
}

func (s *Service) Update(
	ctx context.Context,
	id string,
	in DrinkItemUpdateInput,
) (*DrinkItem, error) {
	if err := auth.Require(ctx, apinames.DrinkItemUpdate); err != nil {
		return nil, err
	}
	itemID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	row, err := s.queries.UpdateDrinkItem(ctx, db.UpdateDrinkItemParams{
		ID:                itemID,
		Name:              in.Name,
		Price:             int32(in.PriceKr * 100),
		Group:             db.DrinkGroup(in.Group),
		SystembolagetID:   in.SystembolagetID,
		BottleEmptyWeight: dbutil.ToInt4(in.BottleEmptyWeight),
		BottleFullWeight:  dbutil.ToInt4(in.BottleFullWeight),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update drink item: %w", err)
	}
	out := toDrinkItem(row)
	return &out, nil
}

// isForeignKeyViolation reports whether err is a Postgres FK-violation
// (SQLSTATE 23503) - used by Delete to reproduce the old app's real
// behavior for "this product still has batch history": the old code let
// Prisma's own FK error propagate up to a caught try/catch that returned
// "Produkt finns i lager" ("product is in stock") rather than deleting.
func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

func (s *Service) Delete(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.DrinkItemDelete); err != nil {
		return err
	}
	itemID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	n, err := s.queries.DeleteDrinkItem(ctx, itemID)
	if err != nil {
		if isForeignKeyViolation(err) {
			return invalidf("drink item still has batch history and can't be deleted")
		}
		return fmt.Errorf("delete drink item: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// csvColumns mirrors stocklistUtils.ts's readCSV row shape exactly:
// quantityType,name,price,group,systembolagetId,bottleEmptyWeight,
// bottleFullWeight - one header row, then one data row per product.
const csvColumns = 7

// ImportCSV bulk-creates drink items from a CSV upload, matching the main
// stocklist page's readFile action. Requires DrinkItemCreate - a real,
// necessary explicit check the old action never had at all (any
// authenticated session that could reach the page could bulk-create
// products with zero server-side authorization).
func (s *Service) ImportCSV(ctx context.Context, r io.Reader) (int, error) {
	if err := auth.Require(ctx, apinames.DrinkItemCreate); err != nil {
		return 0, err
	}
	reader := csv.NewReader(r)
	reader.FieldsPerRecord = -1
	rows, err := reader.ReadAll()
	if err != nil {
		return 0, invalidf("parse CSV: %v", err)
	}
	if len(rows) <= 1 {
		return 0, nil
	}

	created := 0
	for _, row := range rows[1:] { // skip header
		if len(row) < csvColumns {
			return created, invalidf(
				"row %d: expected %d columns, got %d",
				created+2,
				csvColumns,
				len(row),
			)
		}
		priceKr, err := strconv.ParseFloat(row[2], 64)
		if err != nil {
			return created, invalidf("row %d: invalid price %q", created+2, row[2])
		}
		systembolagetID, err := strconv.Atoi(row[4])
		if err != nil {
			return created, invalidf("row %d: invalid systembolagetId %q", created+2, row[4])
		}
		_, err = s.queries.CreateDrinkItem(ctx, db.CreateDrinkItemParams{
			QuantityType:      db.DrinkQuantityType(row[0]),
			Name:              row[1],
			Price:             int32(priceKr * 100),
			Group:             db.DrinkGroup(row[3]),
			SystembolagetID:   int32(systembolagetID),
			BottleEmptyWeight: parseOptionalInt4(row[5]),
			BottleFullWeight:  parseOptionalInt4(row[6]),
		})
		if err != nil {
			return created, fmt.Errorf("row %d: create drink item: %w", created+2, err)
		}
		created++
	}
	return created, nil
}

func parseOptionalInt4(s string) pgtype.Int4 {
	if s == "" {
		return pgtype.Int4{}
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: int32(n), Valid: true}
}

func toDrinkItemBatch(row db.ListDrinkItemBatchesRow) DrinkItemBatch {
	return DrinkItemBatch{
		ID:             dbutil.UUIDStr(row.ID),
		DrinkItemID:    dbutil.UUIDStr(row.DrinkItemID),
		ItemName:       row.ItemName,
		User:           row.User,
		Date:           row.Date.Time,
		QuantityDelta:  row.QuantityDelta,
		NrBottlesDelta: row.NrBottlesDelta.Int32,
	}
}

// ListBatches is a public read (same @@allow("read", true) situation as
// DrinkItem) - beforeDate mirrors treasury/+page.server.ts's `date` filter
// (nil = every entry).
func (s *Service) ListBatches(
	ctx context.Context,
	beforeDate *time.Time,
) ([]DrinkItemBatch, error) {
	var before pgtype.Timestamp
	if beforeDate != nil {
		before = pgtype.Timestamp{Time: *beforeDate, Valid: true}
	}
	rows, err := s.queries.ListDrinkItemBatches(ctx, before)
	if err != nil {
		return nil, fmt.Errorf("list drink item batches: %w", err)
	}
	out := make([]DrinkItemBatch, len(rows))
	for i, row := range rows {
		out[i] = toDrinkItemBatch(row)
	}
	return out, nil
}

// actingUser resolves the studentId stamped onto a batch row, matching the
// old app's `user: user.studentId!`.
func actingUser(ctx context.Context) (string, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.StudentID == "" {
		return "", auth.ErrUnauthenticated
	}
	return identity.StudentID, nil
}

// CreateBatch logs one stock change and atomically applies it to the
// item's running totals - see CreateBatchInput's doc comment for why this
// single signed-delta endpoint replaces the old app's separate
// createInBatch/createOutBatch actions. A negative delta that would drive
// quantityAvailable or nrBottles below zero is rejected (matching the old
// "out" action's `quantityAvailable: {gte: ...}` guard - extended here to
// also guard nrBottles, which the old action didn't, a real gap closed
// rather than replicated since AdjustDrinkItemQuantity guards both for
// free in one atomic statement).
func (s *Service) CreateBatch(ctx context.Context, in CreateBatchInput) (*DrinkItemBatch, error) {
	if err := auth.Require(ctx, apinames.DrinkItemBatchCreate); err != nil {
		return nil, err
	}
	if in.QuantityDelta == 0 {
		return nil, invalidf("quantityDelta must not be 0")
	}
	user, err := actingUser(ctx)
	if err != nil {
		return nil, err
	}
	itemID, err := dbutil.ParseUUID(in.DrinkItemID)
	if err != nil {
		return nil, invalidf("invalid drinkItemId: %v", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed
	qtx := s.queries.WithTx(tx)

	if _, err := qtx.AdjustDrinkItemQuantity(ctx, db.AdjustDrinkItemQuantityParams{
		ID:             itemID,
		QuantityDelta:  in.QuantityDelta,
		NrBottlesDelta: in.NrBottlesDelta,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, invalidf("insufficient stock for this change")
		}
		return nil, fmt.Errorf("adjust drink item quantity: %w", err)
	}

	batchRow, err := qtx.CreateDrinkItemBatch(ctx, db.CreateDrinkItemBatchParams{
		DrinkItemID:    itemID,
		User:           user,
		Date:           pgtype.Timestamp{Time: in.Date, Valid: true},
		QuantityDelta:  in.QuantityDelta,
		NrBottlesDelta: dbutil.ToInt4(&in.NrBottlesDelta),
	})
	if err != nil {
		return nil, fmt.Errorf("create drink item batch: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &DrinkItemBatch{
		ID:             dbutil.UUIDStr(batchRow.ID),
		DrinkItemID:    dbutil.UUIDStr(batchRow.DrinkItemID),
		User:           batchRow.User,
		Date:           batchRow.Date.Time,
		QuantityDelta:  batchRow.QuantityDelta,
		NrBottlesDelta: batchRow.NrBottlesDelta.Int32,
	}, nil
}

// UpdateBatch edits an existing batch entry's delta, mirroring
// treasury's updateEntry: the item's running totals are adjusted by the
// *difference* between the old and new delta, atomically, guarded against
// going negative exactly like CreateBatch.
func (s *Service) UpdateBatch(ctx context.Context, id string, in UpdateBatchInput) error {
	if err := auth.Require(ctx, apinames.DrinkItemBatchUpdate); err != nil {
		return err
	}
	batchID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed
	qtx := s.queries.WithTx(tx)

	old, err := qtx.GetDrinkItemBatchByID(ctx, batchID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get drink item batch: %w", err)
	}

	netQuantityDelta := in.QuantityDelta - old.QuantityDelta
	netBottlesDelta := in.NrBottlesDelta - old.NrBottlesDelta.Int32
	if _, err := qtx.AdjustDrinkItemQuantity(ctx, db.AdjustDrinkItemQuantityParams{
		ID:             old.DrinkItemID,
		QuantityDelta:  netQuantityDelta,
		NrBottlesDelta: netBottlesDelta,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return invalidf("resulting stock would be negative")
		}
		return fmt.Errorf("adjust drink item quantity: %w", err)
	}

	if _, err := qtx.UpdateDrinkItemBatch(ctx, db.UpdateDrinkItemBatchParams{
		ID:             batchID,
		QuantityDelta:  in.QuantityDelta,
		NrBottlesDelta: dbutil.ToInt4(&in.NrBottlesDelta),
	}); err != nil {
		return fmt.Errorf("update drink item batch: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

// DeleteBatch removes a batch entry and reverses its effect on the item's
// running totals, mirroring treasury's deleteEntry - same negative-total
// guard as UpdateBatch/CreateBatch.
func (s *Service) DeleteBatch(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.DrinkItemBatchDelete); err != nil {
		return err
	}
	batchID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed
	qtx := s.queries.WithTx(tx)

	old, err := qtx.GetDrinkItemBatchByID(ctx, batchID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get drink item batch: %w", err)
	}

	if _, err := qtx.AdjustDrinkItemQuantity(ctx, db.AdjustDrinkItemQuantityParams{
		ID:             old.DrinkItemID,
		QuantityDelta:  -old.QuantityDelta,
		NrBottlesDelta: -old.NrBottlesDelta.Int32,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return invalidf("resulting stock would be negative")
		}
		return fmt.Errorf("adjust drink item quantity: %w", err)
	}

	if _, err := qtx.DeleteDrinkItemBatch(ctx, batchID); err != nil {
		return fmt.Errorf("delete drink item batch: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}
