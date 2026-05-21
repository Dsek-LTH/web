package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

var (
	db           *gorm.DB
	JWKSEndpoint string
	JWTIssuer    string
	JWTAudience  string
)

func main() {
	if os.Getenv("GO_ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("Error loading .env file")
		}
	}

	JWKSEndpoint = os.Getenv("JWKS_ENDPOINT")
	JWTIssuer = os.Getenv("JWT_ISSUER")
	JWTAudience = os.Getenv("JWT_AUDIENCE")

	if err := openDatabaseConnection(&db); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := db.AutoMigrate(&scheduledTask{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	scheduledTasks, err := gorm.G[scheduledTask](db).
		Where("has_executed = ?", false).
		Find(context.Background())
	if err != nil {
		log.Fatal("Error fetching scheduled tasks:", err)
	} else {
		for _, task := range scheduledTasks {
			go scheduleTaskExecution(context.Background(), task)
		}
	}

	http.HandleFunc("/schedule", handleRequest)

	serverPort := os.Getenv("SERVER_PORT")
	log.Printf("Server running on :%s", serverPort)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", serverPort), nil))
}
