FROM golang:1.26 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .

# The server, the migration command the deployment runs before it starts
# (`/app/migrate up`), and the seed PR previews fill their own database with
# (`/app/seed`; it wipes the database, so nothing else may run it).
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  CGO_ENABLED=0 go build -trimpath -o /out/backend ./cmd/api \
  && CGO_ENABLED=0 go build -trimpath -o /out/migrate ./cmd/migrate \
  && CGO_ENABLED=0 go build -trimpath -o /out/seed ./cmd/seed

# Includes CA certificates and time zone data (Europe/Stockholm).
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

WORKDIR /app

COPY --from=build /out/backend /out/migrate /out/seed ./
# migrate reads them from file://internal/db/migrations, relative to /app.
COPY internal/db/migrations ./internal/db/migrations

ENV ADDR=":8090"

EXPOSE 8090

ENTRYPOINT ["/app/backend"]
