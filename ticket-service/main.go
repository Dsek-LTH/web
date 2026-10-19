package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/Dsek-LTH/ticket-service/internal/api"
	"github.com/Dsek-LTH/ticket-service/internal/authjwt"
	"github.com/Dsek-LTH/ticket-service/internal/releases"
)

const sweepInterval = 15 * time.Second

func main() {
	if os.Getenv("GO_ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("no .env file found, relying on real environment variables")
		}
	}

	dsn := mustEnv("POSTGRES_URL")
	jwtIssuer := mustEnv("JWT_ISSUER")
	jwtAudience := mustEnv("JWT_AUDIENCE")
	jwksEndpoint := mustEnv("JWKS_ENDPOINT")
	serverPort := mustEnv("SERVER_PORT")

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	svc := releases.NewService(pool)
	scheduler := releases.NewScheduler(svc)
	validator := authjwt.NewValidator(jwtIssuer, jwtAudience, jwksEndpoint)

	if err := scheduler.RestoreOnStartup(ctx); err != nil {
		log.Fatalf("failed to restore scheduled lotteries: %v", err)
	}
	go scheduler.RunSweepLoop(ctx, sweepInterval)

	router := api.NewRouter(svc, scheduler, validator)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", serverPort),
		Handler: router,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("error during shutdown: %v", err)
		}
	}()

	log.Printf("ticket-service listening on :%s", serverPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func mustEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s is required", key)
	}
	return value
}
