package links

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dsek-lth/web/apps/backend/internal/apinames"
	"github.com/dsek-lth/web/apps/backend/internal/auth"
)

// Shlink v3 wraps every list response one level deep; the service decodes
// the inner {data, ...} object into its own types.
func TestListResponsesAreDecoded(t *testing.T) {
	responses := map[string]string{
		"/rest/v3/short-urls": `{"shortUrls":{"data":[{"shortCode":"a","visitsSummary":{"total":3}}],"pagination":{"currentPage":1,"pagesCount":2}}}`,
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

	list, err := svc.List(ctx, ListParams{})
	if err != nil || len(list.Links) != 1 || list.Links[0].ShortCode != "a" ||
		list.PageCount != 2 ||
		list.Links[0].Visits != 3 {
		t.Errorf("list: got %+v (%v)", list, err)
	}
	tags, err := svc.ListTags(ctx)
	if err != nil || len(tags) != 1 || tags[0] != "x" {
		t.Errorf("tags: got %v (%v)", tags, err)
	}
	domains, err := svc.ListDomains(ctx)
	if err != nil || len(domains) != 1 || !domains[0].IsDefault || domains[0].Domain != "l.se" {
		t.Errorf("domains: got %+v (%v)", domains, err)
	}
}
