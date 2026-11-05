// Command openapi prints the API's OpenAPI document as JSON, without a
// database or any other configuration. It is the document the server
// serves at /openapi.json; -3.0 prints the OpenAPI 3.0 downgrade instead
// (/openapi-3.0.json), which is what CI's breaking-change check compares.
//
//	go run ./cmd/openapi > openapi.json
package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"

	"github.com/dsek-lth/web/apps/api/internal/api"
)

func main() {
	downgrade := flag.Bool("3.0", false, "print the OpenAPI 3.0 version")
	flag.Parse()

	doc := api.OpenAPI()
	var (
		out []byte
		err error
	)
	if *downgrade {
		out, err = doc.Downgrade()
	} else {
		out, err = json.MarshalIndent(doc, "", "  ")
	}
	if err != nil {
		log.Fatal(err)
	}
	if _, err := os.Stdout.Write(append(out, '\n')); err != nil {
		log.Fatal(err)
	}
}
