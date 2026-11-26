package api

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/danielgtaylor/huma/v2"
)

// openAPI registers every route with nil services, which is enough to build
// the OpenAPI document. Registering also catches huma's duplicate schema
// name panic, which otherwise only shows when the server starts.
func openAPI(t *testing.T) *huma.OpenAPI {
	t.Helper()
	return registerRoutes(http.NewServeMux(), Services{}).OpenAPI()
}

func TestOperationsAreDocumented(t *testing.T) {
	known := map[string]bool{}
	for _, tag := range apiTags {
		known[tag.Name] = true
	}
	for path, item := range openAPI(t).Paths {
		for method, op := range map[string]*huma.Operation{
			"GET": item.Get, "POST": item.Post, "PUT": item.Put, "PATCH": item.Patch, "DELETE": item.Delete,
		} {
			if op == nil {
				continue
			}
			name := method + " " + path
			if op.OperationID == "" || op.Summary == "" || op.Description == "" {
				t.Errorf("%s: needs an OperationID, Summary and Description", name)
			}
			if len(op.Tags) != 1 || !known[op.Tags[0]] {
				t.Errorf("%s: needs exactly one tag from apiTags, has %v", name, op.Tags)
			}
			if op.RequestBody != nil && op.RequestBody.Content["multipart/form-data"] != nil &&
				op.MaxBodyBytes <= 0 {
				t.Errorf("%s: an upload needs a MaxBodyBytes", name)
			}
		}
	}
}

func TestSchemas(t *testing.T) {
	for name, s := range openAPI(t).Components.Schemas.Map() {
		// An unnamed body struct gets a name like FooOutputBody or Foo2.
		if strings.HasSuffix(name, "Body") || strings.ContainsAny(name, "0123456789") {
			t.Errorf("%s: give the body a named type", name)
		}
		if name == "ErrorModel" || name == "ErrorDetail" || name == "FormFile" {
			continue
		}
		for field, p := range s.Properties {
			if p.Description == "" && !selfExplanatory[field] {
				t.Errorf("%s.%s: needs a doc tag", name, field)
			}
			if p.Type == huma.TypeArray && p.Nullable {
				t.Errorf("%s.%s: arrays must not be nullable", name, field)
			}
		}
	}
}

// selfExplanatory fields need no doc tag: their name (and type, and the
// struct they're in) already says everything a doc would.
var selfExplanatory = map[string]bool{
	"id": true, "slug": true, "name": true, "nameSv": true, "nameEn": true,
	"title": true, "titleSv": true, "titleEn": true, "description": true,
	"descriptionSv": true, "descriptionEn": true, "createdAt": true,
	"updatedAt": true, "firstName": true, "lastName": true, "nickname": true,
	"studentId": true, "email": true, "imageUrl": true, "startAt": true,
	"endAt": true, "location": true, "tags": true, "tagIds": true,
	"pageCount": true, "url": true, "year": true, "member": true,
	"position": true, "committee": true, "committeeId": true,
	"markdownSv": true, "markdownEn": true, "headerSv": true, "headerEn": true,
	"shortDescriptionSv": true, "shortDescriptionEn": true, "messageSv": true,
	"messageEn": true, "apiName": true, "grantCount": true, "roles": true,
	"studentIds": true, "memberIds": true, "commentCount": true,
	"likeCount": true, "goingCount": true, "interestedCount": true,
	"going": true, "interested": true, "articles": true, "events": true,
	"songs": true, "entries": true, "notifications": true, "youtubeUrl": true,
	"bannerUrl": true, "symbolUrl": true, "isCancelled": true,
	"graduationYear": true, "visible": true, "content": true, "published": true,
	"status": true, "type": true, "author": true, "link": true,
	"memberFirstName": true, "memberLastName": true, "bodySv": true,
	"bodyEn": true, "start": true, "end": true, "created": true,
	"bookables": true, "bookableIds": true, "bookingRequest": true,
	"lyrics": true, "melody": true, "video": true, "song": true,
	"shortName": true, "darkImageUrl": true, "lightImageUrl": true,
	"monoImageUrl": true, "previewUrl": true, "startDatetime": true,
	"endDatetime": true, "recipients": true, "count": true, "pictures": true,
	"files": true, "links": true, "data": true, "releaseId": true,
	"releaseTitle": true, "seasonId": true, "categoryId": true,
	"doorName": true, "severity": true, "language": true, "timeSlot": true,
	"classYear": true, "classProgramme": true, "dateCreated": true,
	"lastModified": true, "requestedAt": true, "nollaStartAt": true,
	"revealAt": true, "value": true, "imageUrls": true,
	"notificationText": true, "alarmActive": true, "shortCodes": true,
	"isDisabled": true,
}

func TestNonNilSlices(t *testing.T) {
	type inner struct {
		Tags []string `json:"tags"`
		Raw  []byte   `json:"raw"`
	}
	type outer struct {
		Items  []inner  `json:"items"`
		Ptr    *inner   `json:"ptr"`
		Values []string `json:"values"`
	}
	in := outer{Items: []inner{{}}, Ptr: &inner{}}
	got, err := nonNilSlices(nil, "200", in)
	if err != nil {
		t.Fatal(err)
	}
	b, _ := json.Marshal(got)
	want := `{"items":[{"tags":[],"raw":null}],"ptr":{"tags":[],"raw":null},"values":[]}`
	if string(b) != want {
		t.Errorf("got %s, want %s", b, want)
	}
	if in.Items[0].Tags != nil || in.Ptr.Tags != nil {
		t.Error("the input was modified")
	}
	// Nothing to fill: the same value comes back.
	full := outer{Items: []inner{}, Values: []string{}}
	got, _ = nonNilSlices(nil, "200", full)
	if !reflect.DeepEqual(got, full) {
		t.Errorf("got %v, want %v", got, full)
	}
}

func TestEmptyListIsArray(t *testing.T) {
	mux := http.NewServeMux()
	api := newHumaAPI(mux)
	huma.Get(
		api,
		"/things",
		func(_ context.Context, _ *struct{}) (*struct{ Body []string }, error) {
			return &struct{ Body []string }{}, nil
		},
	)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/things", nil))
	if got := rec.Body.String(); got != "[]\n" {
		t.Errorf("got %q, want []", got)
	}
}

func TestMultipartBodyLimit(t *testing.T) {
	mux := http.NewServeMux()
	api := newHumaAPI(mux)
	huma.Register(api, huma.Operation{
		OperationID:  "upload",
		Method:       http.MethodPost,
		Path:         "/upload",
		MaxBodyBytes: 1000,
	}, func(_ context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			File huma.FormFile `form:"file" required:"true"`
		}]
	},
	) (*struct{}, error) {
		return nil, nil
	})

	upload := func(size int, chunked bool) int {
		var body bytes.Buffer
		w := multipart.NewWriter(&body)
		part, err := w.CreateFormFile("file", "a.txt")
		if err != nil {
			t.Fatal(err)
		}
		_, _ = part.Write(bytes.Repeat([]byte("a"), size))
		_ = w.Close()
		req := httptest.NewRequest(http.MethodPost, "/upload", &body)
		req.Header.Set("Content-Type", w.FormDataContentType())
		if chunked {
			req.ContentLength = -1
		}
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)
		return rec.Code
	}
	if got := upload(100, false); got != http.StatusNoContent {
		t.Errorf("small upload: got %d, want 204", got)
	}
	if got := upload(2000, false); got != http.StatusRequestEntityTooLarge {
		t.Errorf("large upload: got %d, want 413", got)
	}
	if got := upload(2000, true); got < 400 {
		t.Errorf("large chunked upload: got %d, want an error", got)
	}
}
