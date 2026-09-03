-- name: ListDrinkItems :many
SELECT id, quantity_type, name, price, "group", systembolaget_id,
       bottle_empty_weight, bottle_full_weight, quantity_available, nr_bottles
FROM drinkitem
ORDER BY name ASC;

-- name: ListAvailableDrinkItems :many
SELECT id, quantity_type, name, price, "group", systembolaget_id,
       bottle_empty_weight, bottle_full_weight, quantity_available, nr_bottles
FROM drinkitem
WHERE quantity_available > 0
ORDER BY name ASC;

-- name: CreateDrinkItem :one
INSERT INTO drinkitem (
    quantity_type, name, price, "group", systembolaget_id,
    bottle_empty_weight, bottle_full_weight
) VALUES (
    sqlc.arg('quantity_type'), sqlc.arg('name'), sqlc.arg('price'), sqlc.arg('group'),
    sqlc.arg('systembolaget_id'), sqlc.arg('bottle_empty_weight'), sqlc.arg('bottle_full_weight')
)
RETURNING id, quantity_type, name, price, "group", systembolaget_id,
          bottle_empty_weight, bottle_full_weight, quantity_available, nr_bottles;

-- name: UpdateDrinkItem :one
-- Mirrors showproducts' updateSchema exactly - quantityType is not
-- editable via this action (only set at creation), matching the old form's
-- own field set.
UPDATE drinkitem SET
    name = sqlc.arg('name'),
    price = sqlc.arg('price'),
    "group" = sqlc.arg('group'),
    systembolaget_id = sqlc.arg('systembolaget_id'),
    bottle_empty_weight = sqlc.arg('bottle_empty_weight'),
    bottle_full_weight = sqlc.arg('bottle_full_weight')
WHERE id = sqlc.arg('id')
RETURNING id, quantity_type, name, price, "group", systembolaget_id,
          bottle_empty_weight, bottle_full_weight, quantity_available, nr_bottles;

-- name: DeleteDrinkItem :execrows
DELETE FROM drinkitem WHERE id = sqlc.arg('id');

-- name: AdjustDrinkItemQuantity :one
-- Atomically applies a signed adjustment to quantity_available/nr_bottles,
-- guarded so neither can go negative (returns zero rows, not an error, if
-- the guard would be violated - the caller distinguishes "not found" from
-- "insufficient stock" itself). Used by every stocklist write path that
-- touches an item's running totals: CreateBatch (the delta itself),
-- UpdateBatch/DeleteBatch (the net difference between old and new/removed
-- delta) - unifying what the old app implemented as three separate
-- ad-hoc Prisma transactions into one atomic SQL statement.
UPDATE drinkitem SET
    quantity_available = COALESCE(quantity_available, 0) + sqlc.arg('quantity_delta')::int,
    nr_bottles = COALESCE(nr_bottles, 0) + sqlc.arg('nr_bottles_delta')::int
WHERE id = sqlc.arg('id')
  AND COALESCE(quantity_available, 0) + sqlc.arg('quantity_delta')::int >= 0
  AND COALESCE(nr_bottles, 0) + sqlc.arg('nr_bottles_delta')::int >= 0
RETURNING id, quantity_type, name, price, "group", systembolaget_id,
          bottle_empty_weight, bottle_full_weight, quantity_available, nr_bottles;

-- name: ListDrinkItemBatches :many
-- Every batch entry (optionally only those on/before before_date), joined
-- with its item, newest first - matches treasury/+page.server.ts's load
-- exactly (before_date unset = every entry).
SELECT b.id, b.drink_item_id, b."user", b.date, b.quantity_delta, b.nr_bottles_delta,
       i.name AS item_name, i.price AS item_price, i.quantity_type AS item_quantity_type,
       i."group" AS item_group
FROM drinkitembatch b
JOIN drinkitem i ON i.id = b.drink_item_id
WHERE sqlc.narg('before_date')::timestamp IS NULL OR b.date <= sqlc.narg('before_date')::timestamp
ORDER BY b.date DESC;

-- name: GetDrinkItemBatchByID :one
SELECT id, drink_item_id, "user", date, quantity_delta, nr_bottles_delta
FROM drinkitembatch
WHERE id = sqlc.arg('id');

-- name: CreateDrinkItemBatch :one
INSERT INTO drinkitembatch (drink_item_id, "user", date, quantity_delta, nr_bottles_delta)
VALUES (sqlc.arg('drink_item_id'), sqlc.arg('user'), sqlc.arg('date'), sqlc.arg('quantity_delta'), sqlc.arg('nr_bottles_delta'))
RETURNING id, drink_item_id, "user", date, quantity_delta, nr_bottles_delta;

-- name: UpdateDrinkItemBatch :one
UPDATE drinkitembatch SET
    quantity_delta = sqlc.arg('quantity_delta'),
    nr_bottles_delta = sqlc.arg('nr_bottles_delta')
WHERE id = sqlc.arg('id')
RETURNING id, drink_item_id, "user", date, quantity_delta, nr_bottles_delta;

-- name: DeleteDrinkItemBatch :execrows
DELETE FROM drinkitembatch WHERE id = sqlc.arg('id');
