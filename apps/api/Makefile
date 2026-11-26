.PHONY: format dev generate

format:
	go tool goimports -w .
	go tool golines --base-formatter "go tool gofumpt" -w .

dev:
	go tool air --build.cmd "go build -o ./tmp/main ./cmd/api" --build.bin ./tmp/main

generate:
	go tool sqlc generate
