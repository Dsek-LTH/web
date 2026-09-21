.PHONY: format dev generate

format:
	go tool goimports -w .
	go tool golines --base-formatter gofumpt -w .

dev:
	go run .

generate:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate
