FROM golang:1.26.0-alpine AS builder

ENV SERVER_PORT=8091

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY ./ ./

RUN go build -o /ticket-service

FROM gcr.io/distroless/base-debian12 AS runner

WORKDIR /

COPY --from=builder /ticket-service /ticket-service

EXPOSE 8091

USER nonroot:nonroot

ENTRYPOINT ["/ticket-service"]
