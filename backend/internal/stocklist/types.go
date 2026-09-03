package stocklist

import "time"

// DrinkItem is one product tracked by the cafe's drink inventory
// (admin/stocklist) - see Service. Price is stored/exposed in ören
// (matches the drinkitem.price column directly), same unit the frontend's
// running totals/inventory-value math already expects.
type DrinkItem struct {
	ID                string `json:"id"`
	QuantityType      string `json:"quantityType"`
	Name              string `json:"name"`
	Price             int32  `json:"price"`
	Group             string `json:"group"`
	SystembolagetID   int32  `json:"systembolagetId"`
	BottleEmptyWeight *int32 `json:"bottleEmptyWeight,omitempty"`
	BottleFullWeight  *int32 `json:"bottleFullWeight,omitempty"`
	QuantityAvailable int32  `json:"quantityAvailable"`
	NrBottles         int32  `json:"nrBottles"`
}

// DrinkItemCreateInput mirrors addproduct's DrinkItemSchema exactly.
// PriceKr is kronor as entered in the form (not ören) - Create multiplies
// by 100 before storing, matching the old action's own `price: form.data
// .price * 100` and ImportCSV's identical conversion for CSV rows.
type DrinkItemCreateInput struct {
	QuantityType      string  `json:"quantityType"`
	Name              string  `json:"name"`
	PriceKr           float64 `json:"price"`
	Group             string  `json:"group"`
	SystembolagetID   int32   `json:"systembolagetId"`
	BottleEmptyWeight *int32  `json:"bottleEmptyWeight,omitempty"`
	BottleFullWeight  *int32  `json:"bottleFullWeight,omitempty"`
}

// DrinkItemUpdateInput mirrors showproducts' updateSchema exactly -
// quantityType is deliberately absent, matching the old edit form's own
// field set (only ever set at creation).
type DrinkItemUpdateInput struct {
	Name              string  `json:"name"`
	PriceKr           float64 `json:"price"`
	Group             string  `json:"group"`
	SystembolagetID   int32   `json:"systembolagetId"`
	BottleEmptyWeight *int32  `json:"bottleEmptyWeight,omitempty"`
	BottleFullWeight  *int32  `json:"bottleFullWeight,omitempty"`
}

// DrinkItemBatch is one stock-change log entry (a delivery, a sale, a
// manual correction) - admin/stocklist/stockchange and .../treasury.
// ItemName is resolved server-side (joined) so the treasury log renders
// without a second request per row, same reasoning as other domains'
// resolved sub-objects.
type DrinkItemBatch struct {
	ID             string    `json:"id"`
	DrinkItemID    string    `json:"drinkItemId"`
	ItemName       string    `json:"itemName"`
	User           string    `json:"user"`
	Date           time.Time `json:"date"`
	QuantityDelta  int32     `json:"quantityDelta"`
	NrBottlesDelta int32     `json:"nrBottlesDelta"`
}

// CreateBatchInput replaces the old app's separate createInBatch/
// createOutBatch actions with one endpoint: direction is encoded by the
// sign of QuantityDelta/NrBottlesDelta (matching the DB column's own
// signed-delta semantics directly) rather than a boolean "isOut" flag a
// caller would just translate to a sign anyway.
type CreateBatchInput struct {
	DrinkItemID    string    `json:"drinkItemId"`
	QuantityDelta  int32     `json:"quantityDelta"`
	NrBottlesDelta int32     `json:"nrBottlesDelta"`
	Date           time.Time `json:"date"`
}

type UpdateBatchInput struct {
	QuantityDelta  int32 `json:"quantityDelta"`
	NrBottlesDelta int32 `json:"nrBottlesDelta"`
}
