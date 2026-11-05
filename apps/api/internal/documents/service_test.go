package documents

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"path"
	"slices"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/storage"
)

// memStore is an in-memory storage.Backend.
type memStore struct {
	objects map[string]map[string]memObject // bucket -> key -> object
	clock   time.Time
}

type memObject struct {
	data     []byte
	modified time.Time
}

func newMemStore() *memStore {
	return &memStore{objects: map[string]map[string]memObject{}, clock: time.Unix(1_700_000_000, 0)}
}

func (m *memStore) put(bucket, key, data string) {
	if m.objects[bucket] == nil {
		m.objects[bucket] = map[string]memObject{}
	}
	m.clock = m.clock.Add(time.Minute)
	m.objects[bucket][key] = memObject{[]byte(data), m.clock}
}

func (m *memStore) Put(
	_ context.Context,
	bucket, key string,
	r io.Reader,
	_ int64,
) (string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	m.put(bucket, key, string(data))
	return "https://files/" + bucket + "/" + key, nil
}

func (m *memStore) List(
	_ context.Context,
	bucket, prefix string,
	_ bool,
) ([]storage.Object, error) {
	var out []storage.Object
	for key, o := range m.objects[bucket] {
		if strings.HasPrefix(key, prefix) {
			out = append(out, storage.Object{
				Key: key, Name: path.Base(key), Size: int64(len(o.data)),
				LastModified: o.modified, URL: "https://files/" + bucket + "/" + key,
			})
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Key < out[j].Key })
	return out, nil
}

func (m *memStore) Get(_ context.Context, bucket, key string) ([]byte, error) {
	o, ok := m.objects[bucket][key]
	if !ok {
		return nil, storage.ErrNotFound
	}
	return o.data, nil
}

func (m *memStore) Exists(_ context.Context, bucket, key string) (bool, error) {
	_, ok := m.objects[bucket][key]
	return ok, nil
}

func (m *memStore) Copy(_ context.Context, bucket, src, dst string) error {
	o, ok := m.objects[bucket][src]
	if !ok {
		return storage.ErrNotFound
	}
	m.objects[bucket][dst] = o
	return nil
}

func (m *memStore) Remove(_ context.Context, bucket string, keys []string) error {
	for _, k := range keys {
		delete(m.objects[bucket], k)
	}
	return nil
}

func (m *memStore) Upload(context.Context, string, io.Reader) (string, error) { return "", nil }

func (m *memStore) groups(t *testing.T, bucket, folder string) map[string]string {
	t.Helper()
	o, ok := m.objects[bucket][folder+"/"+groupsFile]
	if !ok {
		return nil
	}
	var sc struct {
		Version int               `json:"version"`
		Files   map[string]string `json:"files"`
	}
	if err := json.Unmarshal(o.data, &sc); err != nil {
		t.Fatal(err)
	}
	if sc.Version != 1 {
		t.Errorf("sidecar version = %d, want 1", sc.Version)
	}
	return sc.Files
}

func sidecarJSON(files map[string]string) string {
	b, _ := json.Marshal(map[string]any{"version": 1, "files": files})
	return string(b)
}

func asAdmin() context.Context {
	return auth.ContextWithIdentity(context.Background(), &auth.Identity{Policies: apinames.All()})
}

func with(policies ...string) context.Context {
	return auth.ContextWithIdentity(context.Background(), &auth.Identity{Policies: policies})
}

func groupNames(m Meeting) []string {
	var names []string
	for _, g := range m.Groups {
		names = append(names, g.Name)
	}
	return names
}

func fileNames(files []MeetingDocument) []string {
	var names []string
	for _, f := range files {
		names = append(names, f.Name)
	}
	return names
}

func meetingNames(ms []Meeting) []string {
	var names []string
	for _, m := range ms {
		names = append(names, m.Name)
	}
	return names
}

func TestListMeetingsGroupsFilesByTheSidecar(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM2/Zeta.pdf", "")
	store.put("documents", "public/2026/HTM2/Alpha.pdf", "")
	store.put("documents", "public/2026/HTM2/Kallelse.pdf", "")
	store.put("documents", "public/2026/HTM2/"+groupsFile,
		sidecarJSON(map[string]string{"Zeta.pdf": "Zeta", "Alpha.pdf": "Alpha"}))
	s := NewService(store, "documents", "files")

	meetings, err := s.ListMeetings(asAdmin(), TypeGuildMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	if len(meetings) != 1 || meetings[0].Name != "HTM2" {
		t.Fatalf("meetings = %v", meetingNames(meetings))
	}
	// Named groups by name, ungrouped files last, the sidecar not a file.
	if got := groupNames(meetings[0]); !slices.Equal(got, []string{"Alpha", "Zeta", ""}) {
		t.Errorf("groups = %q", got)
	}
	if got := fileNames(meetings[0].Groups[2].Files); !slices.Equal(got, []string{"Kallelse.pdf"}) {
		t.Errorf("ungrouped files = %q", got)
	}
	if n := meetings[0].Notice; n == nil || n.Name != "Kallelse.pdf" || !n.CanEdit || !n.CanDelete {
		t.Errorf("notice = %+v", n)
	}
}

func TestListMeetingsKeysNestedFilesByTheirPathInTheMeeting(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM2/Folder A/Motion.pdf", "")
	store.put("documents", "public/2026/HTM2/Folder B/Motion.pdf", "")
	store.put("documents", "public/2026/HTM2/"+groupsFile, sidecarJSON(map[string]string{
		"Folder A/Motion.pdf": "Group A",
		"Folder B/Motion.pdf": "Group B",
	}))
	s := NewService(store, "documents", "files")

	meetings, err := s.ListMeetings(asAdmin(), TypeGuildMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	if len(meetings) != 1 {
		t.Fatalf("meetings = %v", meetingNames(meetings))
	}
	g := meetings[0].Groups
	if len(g) != 2 || g[0].Name != "Group A" ||
		g[0].Files[0].ID != "public/2026/HTM2/Folder A/Motion.pdf" ||
		g[1].Name != "Group B" ||
		g[1].Files[0].ID != "public/2026/HTM2/Folder B/Motion.pdf" {
		t.Errorf("groups = %+v", g)
	}
}

func TestListMeetingsSRDMergesBothBucketsAndKeepsOldFiles(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/Möte 1/A.pdf", "")
	store.put("documents", "public/2026/Möte 1/C.pdf", "")
	store.put("documents", "public/2026/Möte 1/"+groupsFile,
		sidecarJSON(map[string]string{"A.pdf": "Group", "C.pdf": "Group"}))
	store.put("files", "public/srd/2026/Möte 1/B.pdf", "")
	store.put("files", "public/srd/2026/Möte 1/D.pdf", "")
	store.put("files", "public/srd/2026/Möte 1/"+groupsFile,
		sidecarJSON(map[string]string{"B.pdf": "Group", "D.pdf": "Group"}))
	// From before the meeting folders: meetings named after the file.
	store.put("files", "public/srd/2026/Möte 2.pdf", "")
	store.put("files", "public/srd/2026/Random/Motion.pdf", "")
	s := NewService(store, "documents", "files")

	meetings, err := s.ListMeetings(asAdmin(), TypeSRDMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	if got := meetingNames(meetings); !slices.Equal(got, []string{"Motion", "Möte 1", "Möte 2"}) {
		t.Fatalf("meetings = %q", got)
	}
	if got := fileNames(
		meetings[1].Groups[0].Files,
	); !slices.Equal(
		got,
		[]string{"A.pdf", "B.pdf", "C.pdf", "D.pdf"},
	) {
		t.Errorf("merged group = %q", got)
	}
}

func TestListMeetingsFiltersByType(t *testing.T) {
	store := newMemStore()
	for _, f := range []string{"S01", "HTM1", "VTM2", "Övrigt", "2026"} {
		store.put("documents", "public/2026/"+f+"/fil.pdf", "")
	}
	store.put("documents", "public/2026/fil.pdf", "") // not in a meeting
	s := NewService(store, "documents", "files")

	cases := map[string][]string{
		TypeBoardMeeting: {"S01"},
		TypeGuildMeeting: {"HTM1", "VTM2"},
		TypeOther:        {"Övrigt"},
	}
	for docType, want := range cases {
		meetings, err := s.ListMeetings(asAdmin(), docType, 2026)
		if err != nil {
			t.Fatal(err)
		}
		if got := meetingNames(meetings); !slices.Equal(got, want) {
			t.Errorf("%s: meetings = %q, want %q", docType, got, want)
		}
	}
}

func TestListMeetingsPicksNoticeAgendaAndMinutes(t *testing.T) {
	store := newMemStore()
	store.put("files", "public/srd/2026/SRD19/2026-10-07-srd19-notice.pdf", "")
	store.put("files", "public/srd/2026/SRD19/1_Fredragningslista_VTM.pdf", "")
	store.put("files", "public/srd/2026/SRD19/2026-10-07-srd19-protocol.pdf", "")
	store.put("files", "public/srd/2026/SRD19/Kallelse_new.pdf", "") // newer notice
	s := NewService(store, "documents", "files")

	meetings, err := s.ListMeetings(asAdmin(), TypeSRDMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	m := meetings[0]
	if m.Notice == nil || m.Notice.Name != "Kallelse_new.pdf" {
		t.Errorf("notice = %+v", m.Notice)
	}
	if m.Agenda == nil || m.Agenda.Name != "1_Fredragningslista_VTM.pdf" {
		t.Errorf("agenda = %+v", m.Agenda)
	}
	if m.Minutes == nil || m.Minutes.Name != "2026-10-07-srd19-protocol.pdf" {
		t.Errorf("minutes = %+v", m.Minutes)
	}
}

func TestListMeetingsIgnoresAnUnreadableSidecar(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM1/Motion.pdf", "")
	store.put("documents", "public/2026/HTM1/"+groupsFile, "not json")
	s := NewService(store, "documents", "files")

	meetings, err := s.ListMeetings(asAdmin(), TypeGuildMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	if got := groupNames(meetings[0]); !slices.Equal(got, []string{""}) {
		t.Errorf("groups = %q", got)
	}
}

func TestListMeetingsPermissionsPerFile(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/Möte 1/A.pdf", "")
	store.put("files", "public/srd/2026/SRD1/B.pdf", "")
	s := NewService(store, "documents", "files")

	ctx := with(apinames.FileDocumentsRead, apinames.FileFilesRead, apinames.FileFilesDelete)
	meetings, err := s.ListMeetings(ctx, TypeSRDMeeting, 2026)
	if err != nil {
		t.Fatal(err)
	}
	a, b := meetings[0].Groups[0].Files[0], meetings[1].Groups[0].Files[0]
	if a.CanDelete || a.CanEdit || !b.CanDelete || b.CanEdit {
		t.Errorf("documents file %+v, files file %+v", a, b)
	}
}

func TestUpdateMovesTheSidecarEntryWithARenamedNestedFile(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM1/Folder/Motion.pdf", "x")
	store.put("documents", "public/2026/HTM1/"+groupsFile,
		sidecarJSON(map[string]string{"Folder/Motion.pdf": "Old"}))
	s := NewService(store, "documents", "files")

	doc, err := s.Update(asAdmin(), TypeGuildMeeting, "public/2026/HTM1/Folder/Motion.pdf",
		MeetingDocumentInput{Name: " Motion2.pdf ", Group: " New "})
	if err != nil {
		t.Fatal(err)
	}
	if doc.ID != "public/2026/HTM1/Folder/Motion2.pdf" || doc.URL == "" {
		t.Errorf("document = %+v", doc)
	}
	if _, ok := store.objects["documents"]["public/2026/HTM1/Folder/Motion.pdf"]; ok {
		t.Error("the old file is still there")
	}
	if got := store.groups(
		t,
		"documents",
		"public/2026/HTM1",
	); len(got) != 1 ||
		got["Folder/Motion2.pdf"] != "New" {
		t.Errorf("sidecar = %v", got)
	}
}

func TestUpdateClearsAGroup(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM1/Motion.pdf", "x")
	store.put(
		"documents",
		"public/2026/HTM1/"+groupsFile,
		sidecarJSON(map[string]string{"Motion.pdf": "Old"}),
	)
	s := NewService(store, "documents", "files")

	if _, err := s.Update(asAdmin(), TypeGuildMeeting, "public/2026/HTM1/Motion.pdf",
		MeetingDocumentInput{Name: "Motion.pdf"}); err != nil {
		t.Fatal(err)
	}
	if got := store.groups(t, "documents", "public/2026/HTM1"); len(got) != 0 {
		t.Errorf("sidecar = %v", got)
	}
}

func TestUpdateWritesNoSidecarForAnUngroupedRename(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM1/Motion.pdf", "x")
	s := NewService(store, "documents", "files")

	if _, err := s.Update(asAdmin(), TypeGuildMeeting, "public/2026/HTM1/Motion.pdf",
		MeetingDocumentInput{Name: "Motion$&.pdf"}); err != nil {
		t.Fatal(err)
	}
	if _, ok := store.objects["documents"]["public/2026/HTM1/"+groupsFile]; ok {
		t.Error("a sidecar was written")
	}
	if _, ok := store.objects["documents"]["public/2026/HTM1/Motion$&.pdf"]; !ok {
		t.Error("the file wasn't renamed literally")
	}
}

func TestUpdateOldSRDFiles(t *testing.T) {
	store := newMemStore()
	store.put("files", "public/srd/2026/Möte 1.pdf", "x")
	s := NewService(store, "documents", "files")

	_, err := s.Update(asAdmin(), TypeSRDMeeting, "public/srd/2026/Möte 1.pdf",
		MeetingDocumentInput{Name: "Möte 1.pdf", Group: "Fika"})
	if !errors.Is(err, ErrInvalidInput) {
		t.Errorf("grouping an old SRD file: %v", err)
	}
	if _, err := s.Update(asAdmin(), TypeSRDMeeting, "public/srd/2026/Möte 1.pdf",
		MeetingDocumentInput{Name: "Möte 01.pdf"}); err != nil {
		t.Fatalf("renaming an old SRD file: %v", err)
	}
	if _, ok := store.objects["files"]["public/srd/2026/Möte 01.pdf"]; !ok {
		t.Error("not renamed")
	}
	if _, ok := store.objects["files"]["public/srd/2026/"+groupsFile]; ok {
		t.Error("a sidecar was written")
	}
}

func TestUpdateRejects(t *testing.T) {
	store := newMemStore()
	store.put("documents", "public/2026/HTM1/Motion.pdf", "x")
	store.put("documents", "public/2026/HTM1/Taken.pdf", "x")
	s := NewService(store, "documents", "files")
	key := "public/2026/HTM1/Motion.pdf"

	for _, in := range []MeetingDocumentInput{
		{Name: groupsFile},
		{Name: ""},
		{Name: "../Motion.pdf"},
		{Name: "Motion.pdf", Group: "a/b"},
		{Name: "Motion.pdf", Group: strings.Repeat("x", 81)},
	} {
		if _, err := s.Update(
			asAdmin(),
			TypeGuildMeeting,
			key,
			in,
		); !errors.Is(
			err,
			ErrInvalidInput,
		) {
			t.Errorf("Update(%+v) = %v, want invalid input", in, err)
		}
	}
	if _, err := s.Update(
		asAdmin(),
		TypeGuildMeeting,
		key,
		MeetingDocumentInput{Name: "Taken.pdf"},
	); !errors.Is(
		err,
		ErrFileExists,
	) {
		t.Errorf("renaming onto another file: %v", err)
	}
	if _, err := s.Update(asAdmin(), TypeGuildMeeting, "public/2026/HTM1/"+groupsFile,
		MeetingDocumentInput{Name: "x.json"}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("editing the sidecar: %v", err)
	}
	if _, err := s.Update(
		with(apinames.FileDocumentsRead, apinames.FileFilesUpdate),
		TypeGuildMeeting,
		key,
		MeetingDocumentInput{Name: "Other.pdf"},
	); !errors.Is(
		err,
		auth.ErrForbidden,
	) {
		t.Errorf("without the documents bucket's update policy: %v", err)
	}
}

func TestDeleteRemovesTheSidecarEntry(t *testing.T) {
	store := newMemStore()
	store.put("files", "public/srd/2026/SRD1/Motion.pdf", "x")
	store.put("files", "public/srd/2026/SRD1/"+groupsFile,
		sidecarJSON(map[string]string{"Motion.pdf": "Motion", "Other.pdf": "Other"}))
	s := NewService(store, "documents", "files")

	if err := s.Delete(with(apinames.FileDocumentsDelete), TypeSRDMeeting,
		"public/srd/2026/SRD1/Motion.pdf"); !errors.Is(err, auth.ErrForbidden) {
		t.Errorf("an SRD file needs the files bucket's delete policy: %v", err)
	}
	if err := s.Delete(asAdmin(), TypeSRDMeeting, "public/srd/2026/SRD1/Motion.pdf"); err != nil {
		t.Fatal(err)
	}
	if got := store.groups(
		t,
		"files",
		"public/srd/2026/SRD1",
	); len(got) != 1 ||
		got["Other.pdf"] != "Other" {
		t.Errorf("sidecar = %v", got)
	}
	if err := s.Delete(
		asAdmin(),
		TypeSRDMeeting,
		"public/srd/2026/SRD1/"+groupsFile,
	); !errors.Is(
		err,
		ErrInvalidInput,
	) {
		t.Errorf("deleting the sidecar: %v", err)
	}
}

func TestUploadWritesTheGroup(t *testing.T) {
	store := newMemStore()
	s := NewService(store, "documents", "files")
	file := func() UploadFile { return UploadFile{Filename: "Motion.pdf", Data: bytes.NewReader([]byte("x"))} }

	stored, err := s.Upload(asAdmin(), UploadMeeting, 2026, " HTM1 ", " Fika ", "Motion", file())
	if err != nil {
		t.Fatal(err)
	}
	if stored.ID != "public/2026/HTM1/Motion.pdf" {
		t.Errorf("key = %q", stored.ID)
	}
	if got := store.groups(t, "documents", "public/2026/HTM1"); got["Motion.pdf"] != "Fika" {
		t.Errorf("sidecar = %v", got)
	}

	if _, err := s.Upload(
		asAdmin(),
		UploadRequirement,
		2026,
		"cpu",
		"Fika",
		"Krav",
		file(),
	); err != nil {
		t.Fatal(err)
	}
	if _, ok := store.objects["files"]["public/kravprofiler/2026/cpu/"+groupsFile]; ok {
		t.Error("a requirement profile got a group")
	}

	for _, folder := range []string{"", "HTM1/Fika", "../HTM1"} {
		if _, err := s.Upload(
			asAdmin(),
			UploadMeeting,
			2026,
			folder,
			"",
			"Motion",
			file(),
		); !errors.Is(
			err,
			ErrInvalidInput,
		) {
			t.Errorf("folder %q: %v", folder, err)
		}
	}
	if _, err := s.Upload(
		asAdmin(),
		UploadMeeting,
		2026,
		"HTM1",
		"",
		"_groups",
		UploadFile{
			Filename: "x.json",
			Data:     bytes.NewReader(nil),
		},
	); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("uploading the sidecar's name: %v", err)
	}
}

func TestMeetingFolder(t *testing.T) {
	s := NewService(nil, "documents", "files")
	cases := []struct {
		bucket, key, folder string
		ok                  bool
	}{
		{"documents", "public/2026/HTM2/Fika/Motion.pdf", "public/2026/HTM2", true},
		{"files", "public/srd/2026/SRD10/Motion.pdf", "public/srd/2026/SRD10", true},
		{"files", "public/2026/HTM2/Motion.pdf", "", false},
		{"files", "public/srd/2026/Möte 1.pdf", "", false},
		{"documents", "public/2026/HTM2/", "", false},
	}
	for _, c := range cases {
		folder, ok := s.meetingFolder(c.bucket, c.key)
		if folder != c.folder || ok != c.ok {
			t.Errorf("meetingFolder(%q, %q) = %q, %v", c.bucket, c.key, folder, ok)
		}
	}
}

func TestBucketOf(t *testing.T) {
	s := NewService(nil, "documents", "files")
	cases := []struct{ docType, key, bucket string }{
		{TypeGuildMeeting, "public/2026/HTM1/protokoll.pdf", "documents"},
		{TypeBoardMeeting, "public/2026/S01/protokoll.pdf", "documents"},
		{TypeOther, "public/2026/Övrigt/fil.pdf", "documents"},
		// The SRD tab lists both buckets.
		{TypeSRDMeeting, "public/srd/2026/SRD1/protokoll.pdf", "files"},
		{TypeSRDMeeting, "public/2026/Möte 1/protokoll.pdf", "documents"},
	}
	for _, c := range cases {
		if bucket, err := s.bucketOf(c.docType, c.key); err != nil || bucket != c.bucket {
			t.Errorf("bucketOf(%q, %q) = %q, %v", c.docType, c.key, bucket, err)
		}
	}
	if _, err := s.bucketOf("members", "x"); err == nil {
		t.Error("bucketOf accepted an unknown document type")
	}
}
