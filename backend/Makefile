.PHONY: format dev generate

format:
	go tool goimports -w .
	go tool golines --base-formatter "go tool gofumpt" -w .

dev:
	go tool air

generate:
	go tool sqlc generate
