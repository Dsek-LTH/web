package links

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
)

// Shlink v3 wraps every list response one level deep; the service must
// hand back the inner {data, ...} object, which is what the admin links
// page reads.
func TestListResponsesAreUnwrapped(t *testing.T) {
	responses := map[string]string{
		"/rest/v3/short-urls": `{"shortUrls":{"data":[{"shortCode":"a"}],"pagination":{"currentPage":1}}}`,
		"/rest/v3/tags":       `{"tags":{"data":["x"],"stats":[]}}`,
		"/rest/v3/domains":    `{"domains":{"data":[{"domain":"l.se","isDefault":true}],"defaultRedirects":{}}}`,
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, ok := responses[r.URL.Path]
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	defer srv.Close()

	svc := NewService(srv.URL, "key")
	ctx := auth.ContextWithIdentity(context.Background(), &auth.Identity{
		MemberID: "m", Policies: []string{apinames.AdminShlinkRead},
	})

	for name, call := range map[string]func() (json.RawMessage, error){
		"list":    func() (json.RawMessage, error) { return svc.List(ctx, ListParams{}) },
		"tags":    func() (json.RawMessage, error) { return svc.ListTags(ctx) },
		"domains": func() (json.RawMessage, error) { return svc.ListDomains(ctx) },
	} {
		body, err := call()
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		var got struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(body, &got); err != nil || len(got.Data) != 1 {
			t.Errorf("%s: want one item under data, got %s (%v)", name, body, err)
		}
	}
}
