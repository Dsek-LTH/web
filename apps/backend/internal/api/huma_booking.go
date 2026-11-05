package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/booking"
)

type bookingRequestOutput struct {
	Body booking.BookingRequest
}

type bookingRequestResultOutput struct {
	Body booking.BookingRequestResult
}

func registerBookingRoutes(api huma.API, svc *booking.Service) {
	tags := []string{"Bookings"}

	huma.Register(api, huma.Operation{
		OperationID: "list-bookable-categories",
		Method:      http.MethodGet,
		Path:        "/bookable-categories",
		Tags:        tags,
		Summary:     "List bookable categories",
		Description: "Needs booking_request:bookable:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []booking.BookableCategory }, error) {
		items, err := svc.ListBookableCategories(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []booking.BookableCategory }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-bookable-category",
		Method:        http.MethodPost,
		Path:          "/bookable-categories",
		Tags:          tags,
		Summary:       "Create a bookable category",
		Description:   "Needs booking_request:bookable:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body booking.BookableCategoryInput }) (*struct{ Body booking.BookableCategory }, error) {
		cat, err := svc.CreateBookableCategory(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body booking.BookableCategory }{Body: *cat}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-bookable-category",
		Method:      http.MethodPut,
		Path:        "/bookable-categories/{id}",
		Tags:        tags,
		Summary:     "Replace a bookable category",
		Description: "Needs booking_request:bookable:update.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body booking.BookableCategoryInput
	},
	) (*struct{ Body booking.BookableCategory }, error) {
		cat, err := svc.UpdateBookableCategory(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body booking.BookableCategory }{Body: *cat}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-bookables",
		Method:      http.MethodGet,
		Path:        "/bookables",
		Tags:        tags,
		Summary:     "List bookables",
		Description: "Everything that can be booked, with its category. Needs booking_request:bookable:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []booking.Bookable }, error) {
		items, err := svc.ListBookables(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []booking.Bookable }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-bookable",
		Method:      http.MethodGet,
		Path:        "/bookables/{id}",
		Tags:        tags,
		Summary:     "Get a bookable",
		Description: "Needs booking_request:bookable:read.",
	}, func(ctx context.Context, input *IDPath) (*struct{ Body booking.Bookable }, error) {
		b, err := svc.GetBookable(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body booking.Bookable }{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-bookable",
		Method:        http.MethodPost,
		Path:          "/bookables",
		Tags:          tags,
		Summary:       "Create a bookable",
		Description:   "Needs booking_request:bookable:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body booking.BookableInput }) (*struct{ Body booking.Bookable }, error) {
		b, err := svc.CreateBookable(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body booking.Bookable }{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-bookable",
		Method:      http.MethodPut,
		Path:        "/bookables/{id}",
		Tags:        tags,
		Summary:     "Replace a bookable",
		Description: "Needs booking_request:bookable:update.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body booking.BookableInput
	},
	) (*struct{ Body booking.Bookable }, error) {
		b, err := svc.UpdateBookable(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body booking.Bookable }{Body: *b}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-booking-requests",
		Method:      http.MethodGet,
		Path:        "/booking-requests",
		Tags:        tags,
		Summary:     "List booking requests",
		Description: "Every request starting at most a week ago. Needs booking_request:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []booking.BookingRequest }, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []booking.BookingRequest }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-booking-doors",
		Method:      http.MethodGet,
		Path:        "/booking-doors",
		Tags:        tags,
		Summary:     "List doors a booking can open",
		Description: "The doors a booking request can ask access to. Needs booking_request:create.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []booking.BookingDoor }, error) {
		doors, err := svc.ListDoors(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []booking.BookingDoor }{Body: doors}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-booking-review-queue",
		Method:      http.MethodGet,
		Path:        "/booking-requests/review-queue",
		Tags:        tags,
		Summary:     "List booking requests to review",
		Description: "Pending requests, each with the active requests it overlaps. Needs booking_request:update.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []booking.BookingReviewItem }, error) {
		items, err := svc.ReviewQueue(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []booking.BookingReviewItem }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-booking-request",
		Method:      http.MethodGet,
		Path:        "/booking-requests/{id}",
		Tags:        tags,
		Summary:     "Get a booking request",
		Description: "Needs booking_request:read.",
	}, func(ctx context.Context, input *IDPath) (*bookingRequestOutput, error) {
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
		Tags:          tags,
		Summary:       "Create a booking request",
		Description:   "As the signed-in member, pending review. Needs booking_request:create. The kårhusmästare is notified.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body booking.BookingRequestInput }) (*bookingRequestResultOutput, error) {
		br, conflicts, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestResultOutput{
			Body: booking.BookingRequestResult{BookingRequest: *br, Conflicts: conflicts},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-booking-request",
		Method:      http.MethodPut,
		Path:        "/booking-requests/{id}",
		Tags:        tags,
		Summary:     "Replace a booking request",
		Description: "Needs booking_request:update, or being the booker. A booker's edit puts the request back to PENDING.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body booking.BookingRequestInput
	},
	) (*bookingRequestResultOutput, error) {
		br, conflicts, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestResultOutput{
			Body: booking.BookingRequestResult{BookingRequest: *br, Conflicts: conflicts},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-booking-request",
		Method:        http.MethodDelete,
		Path:          "/booking-requests/{id}",
		Tags:          tags,
		Summary:       "Delete a booking request",
		Description:   "Needs booking_request:delete, or being the booker.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "accept-booking-request",
		Method:      http.MethodPost,
		Path:        "/booking-requests/{id}/accept",
		Tags:        tags,
		Summary:     "Accept a booking request",
		Description: "Grants the door access for the booking's time plus an hour either side. Without a body, " +
			"the request's own door and member lists are used. Needs booking_request:update. The booker is notified.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body *booking.BookingAccessInput `required:"false"`
	},
	) (*bookingRequestOutput, error) {
		br, err := svc.SetStatus(ctx, input.ID, true, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestOutput{Body: *br}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "reject-booking-request",
		Method:      http.MethodPost,
		Path:        "/booking-requests/{id}/reject",
		Tags:        tags,
		Summary:     "Reject a booking request",
		Description: "Removes any door access it granted. Needs booking_request:update. The booker is notified.",
	}, func(ctx context.Context, input *IDPath) (*bookingRequestOutput, error) {
		br, err := svc.SetStatus(ctx, input.ID, false, nil)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &bookingRequestOutput{Body: *br}, nil
	})
}
