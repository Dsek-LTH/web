FROM golang:1.25.6-alpine AS builder

ENV SERVER_PORT=8080

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY ./ ./

RUN go build -o /scheduler-service

FROM gcr.io/distroless/base-debian12 AS runner

WORKDIR /

COPY --from=builder /scheduler-service /scheduler-service

EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["/scheduler-service"]
