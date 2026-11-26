// Command seed-documents writes sample meeting documents to the MinIO in
// .env (MINIO_*), so the documents page has board, guild and SRD meetings,
// groups and old-format SRD files to show. Development and sandbox only: it
// refuses any endpoint but localhost or a sandbox unless
// ALLOW_DOCUMENT_SEED=true. -clean removes what it writes.
//
// Usage, from apps/api (or make seed-documents / seed-documents-clean):
//
//	go run ./cmd/seed-documents [-clean] [-year 2026]
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Swedish and English, date-prefixed and misspelled names on purpose, so the
// notice/agenda/minutes matching gets exercised. A folder below the meeting
// is the file's group.
var documentFiles = []string{
	// Board meetings
	"S11/Kallelse_S11.pdf",
	"S11/1_Föredragningslista_S11.pdf",
	"S11/Protokoll_S11.pdf",
	"S11/Fika på alla möten/Motion_Fika_S11.pdf",
	"S11/Fika på alla möten/Motion_Fika_bilaga_S11.pdf",
	"S11/Ny hoodie-färg/Proposition_Ny_hoodie_S11.pdf",
	"S11/Årlig ostfest/Proposition_Arlig_ostfest_S11.pdf",
	"S11/Bilaga_budget_S11.pdf",
	"S10/Kallelse_S10.pdf",
	"S10/Föredragningslista_S10.pdf",
	"S10/StudentCouncilMeetingProtocol_S10.pdf",

	// Guild meetings
	"HTM2/Kallelse_HTM2.pdf",
	"HTM2/1_Fredragningslista_HTM2.pdf",
	"HTM2/Protokoll_HTM2.pdf",
	"HTM2/Fika på alla möten/Motion_Fika_HTM2.pdf",
	"HTM2/Fika på alla möten/Motion_Fika_bilaga_A_HTM2.pdf",
	"HTM2/Fika på alla möten/Motion_Fika_bilaga_B_HTM2.pdf",
	"HTM2/Flytta valborg till onsdag/Proposition_Flytta_valborg_HTM2.pdf",
	"HTM2/Flytta valborg till onsdag/Proposition_Flytta_bilaga_HTM2.pdf",
	"HTM2/Gratis kaffe i sektionsrummet/Motion_Gratis_kaffe_HTM2.pdf",
	"HTM2/Gratis kaffe i sektionsrummet/Motion_Gratis_kaffe_bilaga_HTM2.pdf",
	"HTM2/Ny hoodie-färg/Proposition_Ny_hoodie_HTM2.pdf",
	"HTM2/Årlig ostfest/Proposition_Arlig_ostfest_HTM2.pdf",
	"HTM2/Bilaga_budget_HTM2.pdf",
	"HTM2/Bilaga_tidigare_HTM2.pdf",
	"HTM1/Kallelse_HTM1.pdf",
	"HTM1/Föredragningslista_HTM1.pdf",
	"HTM1/Protokoll_HTM1.pdf",
	"HTM1/Mer glitter i valstugan/Motion_Mer_glitter_HTM1.pdf",
	"VTM2/Kallelse_VTM2.pdf",
	"VTM2/Föredragningslista_VTM2.pdf",
	"VTM2/VTM Motesprotokoll.pdf",

	// An old-style SRD meeting in the documents bucket
	"Möte 1/Kallelse_Mote_1.pdf",
	"Möte 1/Föredragningslista_Mote_1.pdf",
	"Möte 1/Protokoll_Mote_1.pdf",
}

var srdFiles = []string{
	"SRD10/Kallelse_SRD10.pdf",
	"SRD10/Föredragningslista_SRD10.pdf",
	"SRD10/Protokoll_SRD10.pdf",
	"SRD10/Fika på alla möten/Motion_Fika_SRD10.pdf",
	"SRD10/Ny hoodie-färg/Proposition_Ny_hoodie_SRD10.pdf",
	"SRD9/2026-10-07-srd9-notice.pdf",
	"SRD9/Föredragningslista_SRD9.pdf",
	"SRD9/2026-10-07-srd9-protocol.pdf",

	// An old-style SRD file directly in the year folder
	"Möte 2.pdf",
}

// A minimal blank PDF, so the links open something valid.
const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF
`

type object struct {
	bucket, key string
	body        []byte
	contentType string
}

// objects turns the sample paths into flat files in their meeting folders
// plus a _groups.json per meeting for the files that had a group folder.
// cleanup also lists the group-folder keys an older version of the seed
// wrote, so -clean removes those too.
func objects(documentsBucket, filesBucket, year string) (writes, cleanup []object) {
	type sidecar struct {
		bucket, key string
		files       map[string]string
	}
	var sidecars []*sidecar
	add := func(paths []string, bucket, base string) {
		for _, p := range paths {
			parts := strings.Split(p, "/")
			fileName := parts[len(parts)-1]
			legacy := object{bucket: bucket, key: base + "/" + p}
			if len(parts) == 1 {
				writes = append(writes, object{bucket, legacy.key, []byte(pdf), "application/pdf"})
				cleanup = append(cleanup, legacy)
				continue
			}
			folder := base + "/" + parts[0]
			key := folder + "/" + fileName
			writes = append(writes, object{bucket, key, []byte(pdf), "application/pdf"})
			cleanup = append(cleanup, object{bucket: bucket, key: key})
			if key != legacy.key {
				cleanup = append(cleanup, legacy)
			}
			group := strings.Join(parts[1:len(parts)-1], "/")
			if group == "" {
				continue
			}
			var sc *sidecar
			for _, s := range sidecars {
				if s.bucket == bucket && s.key == folder+"/_groups.json" {
					sc = s
				}
			}
			if sc == nil {
				sc = &sidecar{bucket, folder + "/_groups.json", map[string]string{}}
				sidecars = append(sidecars, sc)
			}
			sc.files[fileName] = group
		}
	}
	add(documentFiles, documentsBucket, "public/"+year)
	add(srdFiles, filesBucket, "public/srd/"+year)

	for _, sc := range sidecars {
		body, err := json.MarshalIndent(map[string]any{"version": 1, "files": sc.files}, "", "  ")
		if err != nil {
			log.Fatal(err)
		}
		writes = append(writes, object{sc.bucket, sc.key, body, "application/json"})
		cleanup = append(cleanup, object{bucket: sc.bucket, key: sc.key})
	}
	return writes, cleanup
}

func main() {
	clean := flag.Bool("clean", false, "remove the seeded documents instead")
	year := flag.Int("year", time.Now().Year(), "the year to seed")
	flag.Parse()
	_ = godotenv.Load(".env")

	endpoint := os.Getenv("MINIO_ENDPOINT")
	documentsBucket := os.Getenv("PUBLIC_BUCKETS_DOCUMENTS")
	filesBucket := os.Getenv("PUBLIC_BUCKETS_FILES")
	if endpoint == "" || documentsBucket == "" || filesBucket == "" {
		log.Fatal("MINIO_ENDPOINT, PUBLIC_BUCKETS_DOCUMENTS and PUBLIC_BUCKETS_FILES must be set")
	}
	local := strings.Contains(endpoint, "sandbox") || endpoint == "localhost" ||
		endpoint == "127.0.0.1"
	if !local && os.Getenv("ALLOW_DOCUMENT_SEED") != "true" {
		log.Fatalf(
			"refusing to write sample documents to %s; set ALLOW_DOCUMENT_SEED=true to override",
			endpoint,
		)
	}
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"
	port := os.Getenv("MINIO_PORT")
	if port == "" {
		port = map[bool]string{true: "443", false: "80"}[useSSL]
	}
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatalf("MINIO_PORT must be numeric, got %q", port)
	}
	client, err := minio.New(endpoint+":"+port, &minio.Options{
		Creds: credentials.NewStaticV4(
			os.Getenv("MINIO_ROOT_USER"), os.Getenv("MINIO_ROOT_PASSWORD"), ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	writes, cleanup := objects(documentsBucket, filesBucket, strconv.Itoa(*year))
	fmt.Printf("MinIO: %s (%s, %s)\n", endpoint, documentsBucket, filesBucket)

	if *clean {
		for _, o := range cleanup {
			if err := client.RemoveObject(
				ctx,
				o.bucket,
				o.key,
				minio.RemoveObjectOptions{},
			); err != nil {
				log.Fatalf("remove %s/%s: %v", o.bucket, o.key, err)
			}
		}
		fmt.Printf("Removed %d seeded objects.\n", len(cleanup))
		return
	}

	for _, bucket := range []string{documentsBucket, filesBucket} {
		exists, err := client.BucketExists(ctx, bucket)
		if err != nil {
			log.Fatalf("bucket %s: %v", bucket, err)
		}
		if exists {
			continue
		}
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			log.Fatalf("create bucket %s: %v", bucket, err)
		}
		policy := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow",`+
			`"Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`,
			bucket)
		if err := client.SetBucketPolicy(ctx, bucket, policy); err != nil {
			log.Fatalf("make bucket %s public: %v", bucket, err)
		}
	}
	files := 0
	for _, o := range writes {
		_, err := client.PutObject(
			ctx,
			o.bucket,
			o.key,
			bytes.NewReader(o.body),
			int64(len(o.body)),
			minio.PutObjectOptions{ContentType: o.contentType},
		)
		if err != nil {
			log.Fatalf("write %s/%s: %v", o.bucket, o.key, err)
		}
		if o.contentType == "application/pdf" {
			files++
		}
	}
	fmt.Printf("Seeded %d documents and %d group files. Open /documents?year=%d.\n",
		files, len(writes)-files, *year)
}
