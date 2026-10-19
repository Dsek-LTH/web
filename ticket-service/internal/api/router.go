package api

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"github.com/Dsek-LTH/ticket-service/internal/authjwt"
	"github.com/Dsek-LTH/ticket-service/internal/releases"
)

func NewRouter(svc *releases.Service, scheduler *releases.Scheduler, validator *authjwt.Validator) http.Handler {
	mux := http.NewServeMux()
	config := huma.DefaultConfig("Ticket Service", "1.0.0")
	humaAPI := humago.New(mux, config)

	humaAPI.UseMiddleware(authMiddleware(humaAPI, validator))

	h := NewHandlers(svc, scheduler)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "create-release",
		Method:      http.MethodPost,
		Path:        "/releases",
		Summary:     "Create a free-ticket release",
		Metadata:    metadataFor(authMember),
	}, h.createRelease)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "list-releases",
		Method:      http.MethodGet,
		Path:        "/releases",
		Summary:     "List every release with its public aggregate counts",
		Metadata:    metadataFor(authNone),
	}, h.listReleases)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "get-release",
		Method:      http.MethodGet,
		Path:        "/releases/{id}",
		Summary:     "Get public info and aggregate counts for a release",
		Metadata:    metadataFor(authNone),
	}, h.getRelease)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "request-ticket",
		Method:      http.MethodPost,
		Path:        "/releases/{id}/request",
		Summary:     "Join the grace-window pool or waitlist for a release",
		Metadata:    metadataFor(authMember),
	}, h.requestTicket)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "accept-offer",
		Method:      http.MethodPost,
		Path:        "/releases/{id}/accept",
		Summary:     "Accept a granted ticket offer",
		Metadata:    metadataFor(authMember),
	}, h.acceptOffer)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "cancel-entry",
		Method:      http.MethodDelete,
		Path:        "/releases/{id}/request",
		Summary:     "Cancel your request, offer, or waitlist spot",
		Metadata:    metadataFor(authMember),
	}, h.cancelEntry)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "get-status",
		Method:      http.MethodGet,
		Path:        "/releases/{id}/status",
		Summary:     "Get your own status for a release",
		Metadata:    metadataFor(authMember),
	}, h.statusEntry)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "update-release",
		Method:      http.MethodPatch,
		Path:        "/releases/{id}",
		Summary:     "Edit a release after publishing (title/description/location/quantity/closesAt)",
		Metadata:    metadataFor(authMember),
	}, h.updateRelease)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "list-entries",
		Method:      http.MethodGet,
		Path:        "/releases/{id}/entries",
		Summary:     "List every queue entry for a release - the admin roster",
		Metadata:    metadataFor(authMember),
	}, h.listEntries)

	huma.Register(humaAPI, huma.Operation{
		OperationID: "my-tickets",
		Method:      http.MethodGet,
		Path:        "/me/tickets",
		Summary:     "List every ticket the caller has ever requested, across all releases",
		Metadata:    metadataFor(authMember),
	}, h.myTickets)

	return mux
}
