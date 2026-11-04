package search

import (
	"reflect"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

// The structs below only describe Hit.Data for the OpenAPI document - the
// hits themselves stay maps (see toHit), shaped from whatever the index
// stores. Each mirrors a loader in sync.go. Strings other than links are
// cut to 60 characters; for English, every set fooEn is also exposed as
// foo, which is what the resolved fields (Title, Name, ...) are.

// MemberSearchDocument is a hit from the members index.
type MemberSearchDocument struct {
	ID             string  `json:"id"                       doc:"Meilisearch id: the member id, base64 without +/=."`
	FullName       string  `json:"fullName"                 doc:"First and last name."`
	FirstName      *string `json:"firstName,omitempty"`
	LastName       *string `json:"lastName,omitempty"`
	Nickname       *string `json:"nickname,omitempty"`
	StudentID      *string `json:"studentId,omitempty"`
	PicturePath    *string `json:"picturePath,omitempty"    doc:"Profile picture URL."`
	ClassYear      *int32  `json:"classYear,omitempty"      doc:"Year the member started."`
	ClassProgramme *string `json:"classProgramme,omitempty" doc:"Programme code, e.g. D."`
}

// EventSearchDocument is a hit from the events index.
type EventSearchDocument struct {
	ID            string     `json:"id"                      doc:"Meilisearch id."`
	TitleSv       string     `json:"titleSv"`
	TitleEn       *string    `json:"titleEn,omitempty"`
	Title         *string    `json:"title,omitempty"         doc:"English only: titleEn."`
	DescriptionSv string     `json:"descriptionSv"`
	DescriptionEn *string    `json:"descriptionEn,omitempty"`
	Description   *string    `json:"description,omitempty"   doc:"English only: descriptionEn."`
	Slug          *string    `json:"slug,omitempty"`
	Location      *string    `json:"location,omitempty"`
	StartDatetime *time.Time `json:"startDatetime,omitempty" doc:"When the event starts."`
	EndDatetime   *time.Time `json:"endDatetime,omitempty"   doc:"When the event ends."`
}

// ArticleSearchAuthor is the author part of an article hit.
type ArticleSearchAuthor struct {
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	PicturePath *string `json:"picturePath,omitempty" doc:"Profile picture URL."`
}

// ArticleSearchDocument is a hit from the articles index.
type ArticleSearchDocument struct {
	ID          string              `json:"id"                    doc:"Meilisearch id."`
	HeaderSv    string              `json:"headerSv"`
	HeaderEn    *string             `json:"headerEn,omitempty"`
	Header      *string             `json:"header,omitempty"      doc:"English only: headerEn."`
	BodySv      string              `json:"bodySv"                doc:"HTML."`
	BodyEn      *string             `json:"bodyEn,omitempty"      doc:"HTML."`
	Body        *string             `json:"body,omitempty"        doc:"English only: bodyEn."`
	Slug        string              `json:"slug"`
	PublishedAt *time.Time          `json:"publishedAt,omitempty" doc:"When it went live."`
	Author      ArticleSearchAuthor `json:"author"                doc:"The member who wrote it."`
}

// PositionSearchCommittee is the committee part of a position hit.
type PositionSearchCommittee struct {
	ID            string  `json:"id"`
	ShortName     *string `json:"shortName,omitempty"`
	NameSv        string  `json:"nameSv"`
	NameEn        *string `json:"nameEn,omitempty"`
	DarkImageURL  *string `json:"darkImageUrl,omitempty"  doc:"Logo for dark backgrounds."`
	LightImageURL *string `json:"lightImageUrl,omitempty" doc:"Logo for light backgrounds."`
	MonoImageURL  *string `json:"monoImageUrl,omitempty"  doc:"Single-color logo."`
}

// PositionSearchDocument is a hit from the positions index.
type PositionSearchDocument struct {
	ID              string                   `json:"id"                      doc:"Meilisearch id."`
	DsekID          string                   `json:"dsekId"                  doc:"The position id, e.g. dsek.cafe.mastare."`
	NameSv          string                   `json:"nameSv"`
	NameEn          *string                  `json:"nameEn,omitempty"`
	Name            *string                  `json:"name,omitempty"          doc:"English only: nameEn."`
	DescriptionSv   *string                  `json:"descriptionSv,omitempty"`
	DescriptionEn   *string                  `json:"descriptionEn,omitempty"`
	Description     *string                  `json:"description,omitempty"   doc:"English only: descriptionEn."`
	CommitteeID     *string                  `json:"committeeId,omitempty"`
	Committee       *PositionSearchCommittee `json:"committee,omitempty"`
	CommitteeNameSv string                   `json:"committeeNameSv"         doc:"The committee's Swedish name."`
	CommitteeNameEn string                   `json:"committeeNameEn"         doc:"The committee's English name."`
	CommitteeName   *string                  `json:"committeeName,omitempty" doc:"English only: committeeNameEn."`
}

// CommitteeSearchDocument is a hit from the committees index.
type CommitteeSearchDocument struct {
	ID            string  `json:"id"                      doc:"Meilisearch id."`
	ShortName     *string `json:"shortName,omitempty"`
	NameSv        string  `json:"nameSv"`
	NameEn        *string `json:"nameEn,omitempty"`
	Name          *string `json:"name,omitempty"          doc:"English only: nameEn."`
	DescriptionSv *string `json:"descriptionSv,omitempty"`
	DescriptionEn *string `json:"descriptionEn,omitempty"`
	Description   *string `json:"description,omitempty"   doc:"English only: descriptionEn."`
	DarkImageURL  *string `json:"darkImageUrl,omitempty"  doc:"Logo for dark backgrounds."`
	LightImageURL *string `json:"lightImageUrl,omitempty" doc:"Logo for light backgrounds."`
	MonoImageURL  *string `json:"monoImageUrl,omitempty"  doc:"Single-color logo."`
}

// SongSearchDocument is a hit from the songs index.
type SongSearchDocument struct {
	ID       string  `json:"id"                 doc:"Meilisearch id."`
	Title    string  `json:"title"`
	Lyrics   string  `json:"lyrics"`
	Melody   *string `json:"melody,omitempty"   doc:"The tune it's sung to."`
	Category *string `json:"category,omitempty" doc:"Categories, comma separated."`
	Slug     string  `json:"slug"`
}

// GoverningDocumentSearchDocument is a hit from the governingDocuments index.
type GoverningDocumentSearchDocument struct {
	ID      string  `json:"id"             doc:"Meilisearch id."`
	Title   string  `json:"title"`
	Type    *string `json:"type,omitempty" doc:"The governing document type, e.g. POLICY."`
	URL     string  `json:"url"            doc:"Where the PDF is."`
	Content string  `json:"content"        doc:"The start of the PDF's text."`
}

// MeetingDocumentSearchDocument is a hit from the meetingDocuments index.
type MeetingDocumentSearchDocument struct {
	ID      string `json:"id"      doc:"Meilisearch id."`
	Title   string `json:"title"   doc:"File name."`
	URL     string `json:"url"     doc:"Where the PDF is."`
	Content string `json:"content" doc:"The start of the PDF's text."`
}

// Index is a search index's name.
type Index string

func (Index) Schema(r huma.Registry) *huma.Schema {
	const name = "SearchIndex"
	if _, ok := r.Map()[name]; !ok {
		enum := make([]any, len(hitSchemas))
		for i, h := range hitSchemas {
			enum[i] = h.index
		}
		r.Map()[name] = &huma.Schema{Type: huma.TypeString, Enum: enum}
	}
	return &huma.Schema{Ref: "#/components/schemas/" + name}
}

// hitSchemas pairs each index with the document type its hits hold.
var hitSchemas = []struct {
	index string
	name  string
	doc   any
}{
	{IndexMembers, "MemberSearchHit", MemberSearchDocument{}},
	{IndexEvents, "EventSearchHit", EventSearchDocument{}},
	{IndexArticles, "ArticleSearchHit", ArticleSearchDocument{}},
	{IndexPositions, "PositionSearchHit", PositionSearchDocument{}},
	{IndexSongs, "SongSearchHit", SongSearchDocument{}},
	{IndexCommittees, "CommitteeSearchHit", CommitteeSearchDocument{}},
	{IndexGoverningDocuments, "GoverningDocumentSearchHit", GoverningDocumentSearchDocument{}},
	{IndexMeetingDocuments, "MeetingDocumentSearchHit", MeetingDocumentSearchDocument{}},
}

// Schema describes a Hit as one of the per-index hits, told apart by type.
func (Hit) Schema(r huma.Registry) *huma.Schema {
	const prefix = "#/components/schemas/"
	if _, ok := r.Map()["SearchHit"]; !ok {
		union := &huma.Schema{
			Description:   "A search result: the index it's from, and the stored document.",
			Discriminator: &huma.Discriminator{PropertyName: "type", Mapping: map[string]string{}},
		}
		for _, h := range hitSchemas {
			r.Map()[h.name] = &huma.Schema{
				Type:     huma.TypeObject,
				Required: []string{"type", "data"},
				Properties: map[string]*huma.Schema{
					"type": {
						Type:        huma.TypeString,
						Enum:        []any{h.index},
						Description: "The index the hit is from.",
					},
					"data": r.Schema(reflect.TypeOf(h.doc), true, h.name+"Data"),
				},
				AdditionalProperties: false,
			}
			union.OneOf = append(union.OneOf, &huma.Schema{Ref: prefix + h.name})
			union.Discriminator.Mapping[h.index] = prefix + h.name
		}
		r.Map()["SearchHit"] = union
	}
	return &huma.Schema{Ref: prefix + "SearchHit"}
}
