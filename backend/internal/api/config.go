package api

import (
	"net/http"
	"reflect"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
)

// apiTags describes every operation tag, in the order /docs lists them.
// Each huma.Operation names exactly one of these.
var apiTags = []*huma.Tag{
	{Name: "Me", Description: "The signed-in member."},
	{Name: "Articles", Description: "News articles, their likes and comments, and article tags."},
	{
		Name:        "Events",
		Description: "Events, recurring series, attendance, comments and calendar feeds.",
	},
	{Name: "Members", Description: "The member directory, profiles, pictures and pings."},
	{Name: "Committees", Description: "Committees, positions, mandates and the board."},
	{Name: "Access policies", Description: "Which roles and members hold which API policies."},
	{Name: "Nollning", Description: "Nollning seasons, phase, and phadder groups."},
	{Name: "Songs", Description: "The song archive and the printed songbook's index."},
	{Name: "Alerts", Description: "Site-wide alert banners."},
	{Name: "Info pages", Description: "Free-form markdown pages under /info."},
	{
		Name:        "Governing documents",
		Description: "Policies, guidelines and other governing documents.",
	},
	{Name: "Documents", Description: "Meeting documents and requirement profiles stored as files."},
	{Name: "Files", Description: "Miscellaneous uploaded files and article images."},
	{Name: "Gallery", Description: "Photo albums."},
	{Name: "Medals", Description: "Medals derived from mandate history."},
	{Name: "Doors", Description: "Doors and who may open them."},
	{Name: "Bookings", Description: "Bookable resources and booking requests."},
	{Name: "Elections", Description: "Election announcements."},
	{Name: "Cafe", Description: "Cafe shifts, ciabatta of the week and opening hours."},
	{
		Name:        "Notifications",
		Description: "The signed-in member's notifications and notification settings.",
	},
	{Name: "Tickets", Description: "Free-ticket releases and their queues."},
	{Name: "Readme", Description: "Issues of the Readme newsletter."},
	{Name: "Search", Description: "Cross-entity search and the search index."},
	{Name: "Admin", Description: "Admin settings and the link shortener."},
}

// newHumaAPI builds the huma API every operation is registered on. It
// differs from huma.DefaultConfig in three ways:
//   - no `$schema` field in response bodies (DefaultConfig's link transformer);
//   - arrays are never null: their schemas aren't nullable, and
//     nonNilSlices turns every nil slice in a response into an empty one;
//   - the tag list above, for /docs.
func newHumaAPI(mux *http.ServeMux) huma.API {
	huma.DefaultArrayNullable = false
	config := huma.DefaultConfig("D-sektionen API", "1.0.0")
	config.Info.Description = "The backend of the D-sektionen website. Translated fields come both " +
		"as a raw Swedish/English pair and as one field resolved from Accept-Language."
	config.CreateHooks = nil
	config.Tags = apiTags
	config.Transformers = append(config.Transformers, nonNilSlices)
	return humago.New(mux, config)
}

// nonNilSlices replaces every nil slice in a response body with an empty
// one, at any depth, so the client always gets [] rather than null.
func nonNilSlices(_ huma.Context, _ string, v any) (any, error) {
	if v == nil {
		return v, nil
	}
	rv := reflect.ValueOf(v)
	if !hasNilSlice(rv) {
		return v, nil
	}
	return fillSlices(rv).Interface(), nil
}

// hasNilSlice reports whether filling would change anything, so the common
// case (nothing nil) costs no copying.
func hasNilSlice(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.Pointer, reflect.Interface:
		return !v.IsNil() && hasNilSlice(v.Elem())
	case reflect.Slice:
		if v.IsNil() {
			return v.Type().Elem().Kind() != reflect.Uint8
		}
		for i := range v.Len() {
			if hasNilSlice(v.Index(i)) {
				return true
			}
		}
	case reflect.Map:
		for _, k := range v.MapKeys() {
			if hasNilSlice(v.MapIndex(k)) {
				return true
			}
		}
	case reflect.Struct:
		for i := range v.NumField() {
			if v.Type().Field(i).IsExported() && hasNilSlice(v.Field(i)) {
				return true
			}
		}
	}
	return false
}

// fillSlices returns a copy of v with every nil slice replaced by an empty
// one. []byte is left alone (it's a base64 string in JSON, not an array).
func fillSlices(v reflect.Value) reflect.Value {
	switch v.Kind() {
	case reflect.Pointer:
		if v.IsNil() {
			return v
		}
		out := reflect.New(v.Type().Elem())
		out.Elem().Set(fillSlices(v.Elem()))
		return out
	case reflect.Interface:
		if v.IsNil() {
			return v
		}
		out := reflect.New(v.Type()).Elem()
		out.Set(fillSlices(v.Elem()))
		return out
	case reflect.Slice:
		if v.Type().Elem().Kind() == reflect.Uint8 {
			return v
		}
		if v.IsNil() {
			return reflect.MakeSlice(v.Type(), 0, 0)
		}
		out := reflect.MakeSlice(v.Type(), v.Len(), v.Len())
		for i := range v.Len() {
			out.Index(i).Set(fillSlices(v.Index(i)))
		}
		return out
	case reflect.Map:
		if v.IsNil() {
			return v
		}
		out := reflect.MakeMapWithSize(v.Type(), v.Len())
		for _, k := range v.MapKeys() {
			out.SetMapIndex(k, fillSlices(v.MapIndex(k)))
		}
		return out
	case reflect.Struct:
		out := reflect.New(v.Type()).Elem()
		out.Set(v)
		for i := range v.NumField() {
			if v.Type().Field(i).IsExported() {
				out.Field(i).Set(fillSlices(v.Field(i)))
			}
		}
		return out
	}
	return v
}
