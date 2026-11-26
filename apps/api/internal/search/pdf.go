package search

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"regexp"
	"strings"
	"time"
)

// maxPDFSize caps how much of a single document is read into memory.
const maxPDFSize = 50 << 20

// popplerClient extracts text from PDFs through the poppler-server
// container (../poppler-server, POPPLER_SERVER_URL), like the old
// syncDocuments.ts.
type popplerClient struct {
	url  string
	http *http.Client
}

func (p *popplerClient) healthy(ctx context.Context) bool {
	if p.url == "" {
		return false
	}
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.url+"/health", nil)
	if err != nil {
		return false
	}
	res, err := p.http.Do(req)
	if err != nil {
		return false
	}
	res.Body.Close()
	return res.StatusCode < 300
}

func (p *popplerClient) toText(ctx context.Context, pdf []byte, fileName string) (string, error) {
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	// poppler-server rejects any part not typed application/pdf, which
	// CreateFormFile's octet-stream default would be.
	header := textproto.MIMEHeader{}
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename=%q`, fileName))
	header.Set("Content-Type", "application/pdf")
	part, err := form.CreatePart(header)
	if err != nil {
		return "", err
	}
	if _, err := part.Write(pdf); err != nil {
		return "", err
	}
	if err := form.Close(); err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.url, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", form.FormDataContentType())
	res, err := p.http.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return "", fmt.Errorf("poppler: %s", res.Status)
	}
	text, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	return filterContent(string(text)), nil
}

// githubPathPattern matches governing-document urls that are paths into
// the Dsek-LTH GitHub organisation rather than full URLs (see
// src/lib/utils/servePdf.ts).
var (
	githubPathPattern = regexp.MustCompile(`^(styrdokument|policys|reglemente|stadgar|riktlinjer)`)
	safeGithubPath    = regexp.MustCompile(`^[\w/.-]+$`)
)

// fetchPDF downloads a governing document. GitHub serves its files as
// application/octet-stream, everything else must say application/pdf -
// the same checks the old servePdf/getFileContent pair made.
func fetchPDF(ctx context.Context, client *http.Client, docURL string) ([]byte, error) {
	wantType := "application/pdf"
	if githubPathPattern.MatchString(docURL) {
		if !safeGithubPath.MatchString(docURL) {
			return nil, fmt.Errorf("invalid GitHub path %q", docURL)
		}
		docURL = "https://github.com/Dsek-LTH/" + docURL
		wantType = "application/octet-stream"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, docURL, nil)
	if err != nil {
		return nil, err
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return nil, fmt.Errorf("fetch %s: %s", docURL, res.Status)
	}
	if !strings.HasPrefix(res.Header.Get("Content-Type"), wantType) {
		return nil, fmt.Errorf("not a PDF: %s", docURL)
	}
	return io.ReadAll(io.LimitReader(res.Body, maxPDFSize))
}

var (
	// The guild's LaTeX template writes "sektionögalud" in its header in
	// a private-use-area font; the glyphs never show up in queries.
	templateGlyphs = strings.NewReplacer(
		"", "", "", "", "", "", "", "", "", "",
		"", "", "", "", "", "", "", "", "", "",
		"", "", "", "", "", "",
	)
	templateDTLH       = regexp.MustCompile(`-?\s*D\s*(T\s*L|L\s*T)`)
	templateGuildTitle = regexp.MustCompile(`D-SEKTIONEN INOM TLTH\n\s*H\s*\n`)
	trailingSpace      = regexp.MustCompile(`[^\S\r\n]+\n`)
	blankLines         = regexp.MustCompile(`\n{2,}`)
)

// filterContent strips the template header noise from extracted text - a
// port of the old syncDocuments.ts filterContent, same steps and order.
func filterContent(content string) string {
	content = templateGlyphs.Replace(content)
	content = templateDTLH.ReplaceAllString(content, "")
	content = templateGuildTitle.ReplaceAllString(content, "")
	content = trailingSpace.ReplaceAllString(content, "\n")
	return blankLines.ReplaceAllString(content, "\n")
}
