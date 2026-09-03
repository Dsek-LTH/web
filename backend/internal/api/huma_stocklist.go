package api

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/stocklist"
)

type listDrinkItemsInput struct {
	AvailableOnly bool `query:"availableOnly" doc:"only items with quantityAvailable > 0 - matches the main stocklist page; omit for showproducts' full list"`
}

type listDrinkItemsOutput struct {
	Body []stocklist.DrinkItem
}

type inventoryValueOutput struct {
	Body struct {
		Value float64 `json:"value"`
	}
}

type createDrinkItemInput struct {
	Body stocklist.DrinkItemCreateInput
}

type drinkItemOutput struct {
	Body stocklist.DrinkItem
}

type updateDrinkItemInput struct {
	ID   string `path:"id"`
	Body stocklist.DrinkItemUpdateInput
}

type deleteDrinkItemInput struct {
	ID string `path:"id"`
}

type importDrinkItemsInput struct {
	RawBody huma.MultipartFormFiles[struct {
		File huma.FormFile `form:"file" required:"true"`
	}]
}

type importDrinkItemsOutput struct {
	Body struct {
		Created int `json:"created"`
	}
}

type listDrinkItemBatchesInput struct {
	BeforeDate string `query:"beforeDate" doc:"YYYY-MM-DD; unset lists every batch entry"`
}

type listDrinkItemBatchesOutput struct {
	Body []stocklist.DrinkItemBatch
}

type createDrinkItemBatchInput struct {
	Body stocklist.CreateBatchInput
}

type drinkItemBatchOutput struct {
	Body stocklist.DrinkItemBatch
}

type updateDrinkItemBatchInput struct {
	ID   string `path:"id"`
	Body stocklist.UpdateBatchInput
}

type deleteDrinkItemBatchInput struct {
	ID string `path:"id"`
}

func registerStocklistRoutes(api huma.API, svc *stocklist.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-drink-items",
		Method:      http.MethodGet,
		Path:        "/drink-items",
		Summary:     "List cafe drink-inventory products",
	}, func(ctx context.Context, input *listDrinkItemsInput) (*listDrinkItemsOutput, error) {
		items, err := svc.List(ctx, input.AvailableOnly)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listDrinkItemsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-drink-inventory-value",
		Method:      http.MethodGet,
		Path:        "/drink-items/inventory-value",
		Summary:     "Compute the current total inventory value",
	}, func(ctx context.Context, input *struct{}) (*inventoryValueOutput, error) {
		value, err := svc.InventoryValue(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &inventoryValueOutput{}
		out.Body.Value = value
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-drink-item",
		Method:        http.MethodPost,
		Path:          "/drink-items",
		Summary:       "Create a drink-inventory product",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createDrinkItemInput) (*drinkItemOutput, error) {
		item, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &drinkItemOutput{Body: *item}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-drink-item",
		Method:      http.MethodPatch,
		Path:        "/drink-items/{id}",
		Summary:     "Update a drink-inventory product",
	}, func(ctx context.Context, input *updateDrinkItemInput) (*drinkItemOutput, error) {
		item, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &drinkItemOutput{Body: *item}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-drink-item",
		Method:        http.MethodDelete,
		Path:          "/drink-items/{id}",
		Summary:       "Delete a drink-inventory product",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteDrinkItemInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "import-drink-items-csv",
		Method:        http.MethodPost,
		Path:          "/drink-items/import",
		Summary:       "Bulk-create drink-inventory products from a CSV upload",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *importDrinkItemsInput) (*importDrinkItemsOutput, error) {
		data := input.RawBody.Data()
		created, err := svc.ImportCSV(ctx, data.File)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &importDrinkItemsOutput{}
		out.Body.Created = created
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-drink-item-batches",
		Method:      http.MethodGet,
		Path:        "/drink-item-batches",
		Summary:     "List drink-inventory stock-change log entries",
	}, func(ctx context.Context, input *listDrinkItemBatchesInput) (*listDrinkItemBatchesOutput, error) {
		var beforeDate *time.Time
		if input.BeforeDate != "" {
			t, err := time.Parse("2006-01-02", input.BeforeDate)
			if err != nil {
				return nil, huma.Error400BadRequest("invalid beforeDate, expected YYYY-MM-DD")
			}
			beforeDate = &t
		}
		items, err := svc.ListBatches(ctx, beforeDate)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listDrinkItemBatchesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-drink-item-batch",
		Method:        http.MethodPost,
		Path:          "/drink-item-batches",
		Summary:       "Log a stock change and apply it to the item's running totals",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createDrinkItemBatchInput) (*drinkItemBatchOutput, error) {
		batch, err := svc.CreateBatch(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &drinkItemBatchOutput{Body: *batch}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "update-drink-item-batch",
		Method:        http.MethodPatch,
		Path:          "/drink-item-batches/{id}",
		Summary:       "Edit a stock-change log entry's delta",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *updateDrinkItemBatchInput) (*struct{}, error) {
		if err := svc.UpdateBatch(ctx, input.ID, input.Body); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-drink-item-batch",
		Method:        http.MethodDelete,
		Path:          "/drink-item-batches/{id}",
		Summary:       "Delete a stock-change log entry and reverse its effect",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteDrinkItemBatchInput) (*struct{}, error) {
		if err := svc.DeleteBatch(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
