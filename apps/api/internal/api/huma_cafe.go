package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/cafe"
)

func registerCafeRoutes(api huma.API, svc *cafe.Service) {
	tags := []string{"Cafe"}

	huma.Register(api, huma.Operation{
		OperationID: "list-cafe-opening-hours",
		Method:      http.MethodGet,
		Path:        "/cafe/opening-hours",
		Tags:        tags,
		Summary:     "List the cafe's opening hours",
		Description: "The cafe:open* info pages, one per weekday.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []cafe.CafeOpeningHours }, error) {
		items, err := svc.ListOpeningHours(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []cafe.CafeOpeningHours }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-cafe-schedule",
		Method:      http.MethodGet,
		Path:        "/cafe/schedule",
		Tags:        tags,
		Summary:     "Get a week's cafe schedule",
		Description: "The week's shifts and ciabatta. Without cafe:see_all_weeks, only this week " +
			"and the next two can be viewed.",
	}, func(ctx context.Context, input *struct {
		Year int32 `query:"year" doc:"ISO year. Defaults to the current one."`
		Week int32 `query:"week" doc:"ISO week, 1-53. Defaults to the current one."`
	},
	) (*struct{ Body cafe.CafeSchedule }, error) {
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
		return &struct{ Body cafe.CafeSchedule }{Body: *schedule}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "toggle-cafe-shift",
		Method:      http.MethodPost,
		Path:        "/cafe/shifts/toggle",
		Tags:        tags,
		Summary:     "Toggle a cafe shift",
		Description: "Signs the member up for an open slot, takes them off their own slot, or (with " +
			"cafe:edit_workers) gives someone else's slot to them. Without cafe:edit_workers, " +
			"a shift can only be quit while it is at least two days away.",
	}, func(ctx context.Context, input *struct{ Body cafe.CafeShiftToggleInput }) (*struct{ Body cafe.CafeShiftResult }, error) {
		result, err := svc.SetShift(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body cafe.CafeShiftResult }{Body: *result}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-cafe-ciabatta",
		Method:      http.MethodPut,
		Path:        "/cafe/ciabattas/{year}/{week}",
		Tags:        tags,
		Summary:     "Set a week's ciabatta",
		Description: "Needs cafe:edit_ciabattas.",
	}, func(ctx context.Context, input *struct {
		Year int32 `path:"year" doc:"ISO year."`
		Week int32 `path:"week" doc:"ISO week, 1-53."`
		Body cafe.CiabattaInput
	},
	) (*struct{ Body cafe.Ciabatta }, error) {
		c, err := svc.SetCiabatta(ctx, input.Year, input.Week, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body cafe.Ciabatta }{Body: *c}, nil
	})
}
