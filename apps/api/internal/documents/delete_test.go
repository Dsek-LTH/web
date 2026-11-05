package documents

import (
	"testing"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
)

func TestDeleteTargetPicksTheBucketAFileIsIn(t *testing.T) {
	s := NewService(nil, "documents", "files")
	cases := []struct {
		docType, key, bucket, policy string
	}{
		{
			TypeGuildMeeting,
			"public/2026/HTM1/protokoll.pdf",
			"documents",
			apinames.FileDocumentsDelete,
		},
		{
			TypeBoardMeeting,
			"public/2026/S01/protokoll.pdf",
			"documents",
			apinames.FileDocumentsDelete,
		},
		{TypeOther, "public/2026/Övrigt/fil.pdf", "documents", apinames.FileDocumentsDelete},
		// The SRD tab lists both buckets: SRD files from the files bucket,
		// and "Möte ..." folders from the documents bucket.
		{TypeSRDMeeting, "public/srd/2026/SRD1/protokoll.pdf", "files", apinames.FileFilesDelete},
		{
			TypeSRDMeeting,
			"public/2026/Möte 1/protokoll.pdf",
			"documents",
			apinames.FileDocumentsDelete,
		},
	}
	for _, c := range cases {
		bucket, policy, err := s.deleteTarget(c.docType, c.key)
		if err != nil {
			t.Fatalf("deleteTarget(%q, %q): %v", c.docType, c.key, err)
		}
		if bucket != c.bucket || policy != c.policy {
			t.Errorf("deleteTarget(%q, %q) = %q, %q, want %q, %q",
				c.docType, c.key, bucket, policy, c.bucket, c.policy)
		}
	}
	if _, _, err := s.deleteTarget("members", "public/2026/HTM1/protokoll.pdf"); err == nil {
		t.Error("deleteTarget accepted an unknown document type")
	}
}
