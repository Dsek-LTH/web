package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/booking"
)

type listBookableCategoriesOutput struct {
	Body []booking.BookableCategory
}

type createBookableCategoryInput struct {
	Body booking.BookableCategoryInput
}

type updateBookableCategoryInput struct {
	ID   string `path:"id"`
	Body booking.BookableCategoryInput
}

type bookableCategoryOutput struct {
	Body booking.BookableCategory
}

type listBookablesOutput struct {
	Body []booking.Bookable
}

type bookableIDInput struct {
	ID string `path:"id"`
}

type createBookableInput struct {
	Body booking.BookableInput
}

type updateBookableInput struct {
	ID   string `path:"id"`
	Body booking.BookableInput
}

type bookableOutput struct {
	Body booking.Bookable
}

type listBookingRequestsOutput struct {
	Body []booking.BookingRequest
}

type bookingRequestIDInput struct {
	ID string `path:"id"`
}

type bookingRequestOutput struct {
	Body booking.BookingRequest
}

type createBookingRequestInput struct {
	Body booking.BookingRequestInput
}

type updateBookingRequestInput struct {
	ID   string `path:"id"`
	Body booking.BookingRequestInput
}

// bookingRequestWithConflictsOutput is create/update's response shape -
// Conflicts is a non-blocking warning (2026-09-02 decision, see
// DESIGN.md's Booking section): other non-denied requests overlapping the
// submitted one for at least one shared bookable. The old app never
// checked for this at all; Go surfaces it as information rather than
// rejecting the request outright.
type bookingRequestWithConflictsOutput struct {
	Body struct {
		BookingRequest booking.BookingRequest   `json:"bookingRequest"`
		Conflicts      []booking.BookingRequest `json:"conflicts"`
	}
}

func registerBookingRoutes(api huma.API, svc *booking.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-bookable-categories",
		Method:      http.MethodGet,
		Path:        "/bookable-categories",
		Summary:     "List bookable categories",
	}, func(ctx context.Context, input *struct{}) (*listBookableCategoriesOutput, error) {
		items, err := svc.ListBookableCategories(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listBookableCategoriesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-bookable-category",
		Method:        http.MethodPost,
		Path:          "/bookable-categories",
		Summary:       "Create a bookable category",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createBookableCategoryInput) (*bookableCategoryOutput, error) {
		cat, err := svc.CreateBookableCategory(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookableCategoryOutput{Body: *cat}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-bookable-category",
		Method:      http.MethodPatch,
		Path:        "/bookable-categories/{id}",
		Summary:     "Replace a bookable category (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateBookableCategoryInput) (*bookableCategoryOutput, error) {
		cat, err := svc.UpdateBookableCategory(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookableCategoryOutput{Body: *cat}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-bookables",
		Method:      http.MethodGet,
		Path:        "/bookables",
		Summary:     "List bookable resources",
	}, func(ctx context.Context, input *struct{}) (*listBookablesOutput, error) {
		items, err := svc.ListBookables(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listBookablesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-bookable",
		Method:      http.MethodGet,
		Path:        "/bookables/{id}",
		Summary:     "Get a bookable resource",
	}, func(ctx context.Context, input *bookableIDInput) (*bookableOutput, error) {
		b, err := svc.GetBookable(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookableOutput{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-bookable",
		Method:        http.MethodPost,
		Path:          "/bookables",
		Summary:       "Create a bookable resource",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createBookableInput) (*bookableOutput, error) {
		b, err := svc.CreateBookable(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookableOutput{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-bookable",
		Method:      http.MethodPatch,
		Path:        "/bookables/{id}",
		Summary:     "Replace a bookable resource (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateBookableInput) (*bookableOutput, error) {
		b, err := svc.UpdateBookable(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookableOutput{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-booking-requests",
		Method:      http.MethodGet,
		Path:        "/booking-requests",
		Summary:     "List upcoming booking requests",
	}, func(ctx context.Context, input *struct{}) (*listBookingRequestsOutput, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listBookingRequestsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-booking-request",
		Method:      http.MethodGet,
		Path:        "/booking-requests/{id}",
		Summary:     "Get a booking request",
	}, func(ctx context.Context, input *bookingRequestIDInput) (*bookingRequestOutput, error) {
		br, err := svc.Get(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestOutput{Body: *br}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-booking-request",
		Method:        http.MethodPost,
		Path:          "/booking-requests",
		Summary:       "Create a booking request",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createBookingRequestInput) (*bookingRequestWithConflictsOutput, error) {
		br, conflicts, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &bookingRequestWithConflictsOutput{}
		out.Body.BookingRequest = *br
		out.Body.Conflicts = conflicts
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-booking-request",
		Method:      http.MethodPatch,
		Path:        "/booking-requests/{id}",
		Summary:     "Replace a booking request (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateBookingRequestInput) (*bookingRequestWithConflictsOutput, error) {
		br, conflicts, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &bookingRequestWithConflictsOutput{}
		out.Body.BookingRequest = *br
		out.Body.Conflicts = conflicts
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-booking-request",
		Method:        http.MethodDelete,
		Path:          "/booking-requests/{id}",
		Summary:       "Delete a booking request",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *bookingRequestIDInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "accept-booking-request",
		Method:      http.MethodPost,
		Path:        "/booking-requests/{id}/accept",
		Summary:     "Accept a booking request",
	}, func(ctx context.Context, input *bookingRequestIDInput) (*bookingRequestOutput, error) {
		br, err := svc.SetStatus(ctx, input.ID, true)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestOutput{Body: *br}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "reject-booking-request",
		Method:      http.MethodPost,
		Path:        "/booking-requests/{id}/reject",
		Summary:     "Reject a booking request",
	}, func(ctx context.Context, input *bookingRequestIDInput) (*bookingRequestOutput, error) {
		br, err := svc.SetStatus(ctx, input.ID, false)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestOutput{Body: *br}, nil
	})
}
