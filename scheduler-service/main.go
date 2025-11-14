package main

import (
	"context"
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

var (
	db *gorm.DB
	// TODO: Remove global context
	ctx context.Context
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	ctx = context.Background()

	if err := openDatabaseConnection(&db); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := db.AutoMigrate(&ScheduledTask{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// TODO: Remove this
	if _, err := gorm.G[ScheduledTask](db).Where("1 = 1").Delete(ctx); err != nil {
		log.Println("Error clearing scheduled tasks:", err)
	}

	if scheduledTasks, err := gorm.G[ScheduledTask](db).Where("has_executed = ?", false).Find(ctx); err != nil {
		log.Println("Error fetching scheduled tasks:", err)
	} else {
		for _, task := range scheduledTasks {
			go scheduleTaskExecution(task)
		}
	}

	http.Handle("/schedule", rateLimitMiddleware(http.HandlerFunc(handlePost)))

	// TODO: Read port from env
	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
