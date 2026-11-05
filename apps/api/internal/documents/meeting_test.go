package documents

import (
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/storage"
)

func TestBuildMeetingMatchesPrefixes(t *testing.T) {
	now := time.Now()
	files := []storage.Object{
		{Key: "a", Name: "Kallelse HTM1.pdf", LastModified: now},
		{Key: "b", Name: "Bilaga till agenda.pdf", LastModified: now},
		{Key: "c", Name: "Föredragningslista.pdf", LastModified: now},
		{Key: "d", Name: "Mötesprotokoll HTM1.pdf", LastModified: now},
	}
	m := buildMeeting("HTM1", files)
	if m.Notice == nil || m.Notice.Name != "Kallelse HTM1.pdf" {
		t.Errorf("notice = %+v", m.Notice)
	}
	if m.Agenda == nil || m.Agenda.Name != "Föredragningslista.pdf" {
		t.Errorf("agenda = %+v", m.Agenda)
	}
	if m.Minutes == nil || m.Minutes.Name != "Mötesprotokoll HTM1.pdf" {
		t.Errorf("minutes = %+v", m.Minutes)
	}
	if len(m.Files) != 1 || m.Files[0].Name != "Bilaga till agenda.pdf" {
		t.Errorf("other files = %+v", m.Files)
	}
}
