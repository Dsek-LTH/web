package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/cafe"
)

type listOpeningHoursOutput struct {
	Body []cafe.OpeningHour
}

type getScheduleInput struct {
	Year int32 `query:"year" doc:"defaults to the current ISO year"`
	Week int32 `query:"week" doc:"1-53, defaults to the current ISO week"`
}

type getScheduleOutput struct {
	Body cafe.Schedule
}

type setShiftInput struct {
	Body cafe.SetShiftInput
}

type setShiftOutput struct {
	Body cafe.ShiftMutationResult
}

type setCiabattaInput struct {
	Body cafe.SetCiabattaInput
}

type ciabattaOutput struct {
	Body cafe.Ciabatta
}

func registerCafeRoutes(api huma.API, svc *cafe.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-cafe-opening-hours",
		Method:      http.MethodGet,
		Path:        "/cafe/opening-hours",
		Summary:     "List the cafe's opening-hours pages (\"cafe:open*\" markdowns rows)",
	}, func(ctx context.Context, input *struct{}) (*listOpeningHoursOutput, error) {
		items, err := svc.ListOpeningHours(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listOpeningHoursOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-cafe-schedule",
		Method:      http.MethodGet,
		Path:        "/cafe/schedule",
		Summary:     "Get a week's cafe shifts and ciabatta-of-the-week",
	}, func(ctx context.Context, input *getScheduleInput) (*getScheduleOutput, error) {
		var year, week *int32
		if input.Year != 0 {
			year = &input.Year
		}
		if input.Week != 0 {
			week = &input.Week
		}
		schedule, err := svc.GetSchedule(ctx, year, week)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &getScheduleOutput{Body: *schedule}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-cafe-shift",
		Method:      http.MethodPut,
		Path:        "/cafe/shifts",
		Summary:     "Sign up for, quit, or (with cafe:edit_workers) reassign a cafe shift",
	}, func(ctx context.Context, input *setShiftInput) (*setShiftOutput, error) {
		result, err := svc.SetShift(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &setShiftOutput{Body: *result}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-cafe-ciabatta",
		Method:      http.MethodPut,
		Path:        "/cafe/ciabatta",
		Summary:     "Set the ciabatta-of-the-week for a given year/week (upsert)",
	}, func(ctx context.Context, input *setCiabattaInput) (*ciabattaOutput, error) {
		c, err := svc.SetCiabatta(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &ciabattaOutput{Body: *c}, nil
	})
}
