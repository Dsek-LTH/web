package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ScheduledTaskRequestData struct {
	RunTimestamp string `json:"runTimestamp"`
	EndpointURL  string `json:"endpointURL"`
	Body         string `json:"body"`
	Password     string `json:"password"`
}

type ScheduledTask struct {
	gorm.Model
	RunTimestamp string
	EndpointURL  string
	Body         string
	HasExecuted  bool
}

var (
	db  *gorm.DB
	ctx context.Context
)

func handlePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)

		return
	}

	var data ScheduledTaskRequestData
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)

		return
	}

	if data.Password != os.Getenv("PASSWORD") {
		log.Printf("Unauthorised access attempt from %s with password: %s", r.RemoteAddr, data.Password)
		http.Error(w, "Unauthorised", http.StatusUnauthorized)

		return
	}

	newTask := ScheduledTask{
		RunTimestamp: data.RunTimestamp,
		EndpointURL:  data.EndpointURL,
		Body:         data.Body,
		HasExecuted:  false,
	}

	err = gorm.G[ScheduledTask](db).Create(ctx, &newTask)
	if err != nil {
		http.Error(w, "Failed to write to database", http.StatusInternalServerError)

		return
	} else {
		log.Printf("Scheduled task created: %+v", struct {
			RunTimestamp string
			EndpointURL  string
			Body         string
		}{
			RunTimestamp: newTask.RunTimestamp,
			EndpointURL:  newTask.EndpointURL,
			Body:         newTask.Body,
		})
	}

	scheduleTaskExecution(newTask)

	w.WriteHeader(http.StatusCreated)
}

func scheduleTaskExecution(task ScheduledTask) {
	runTime, err := time.Parse(time.RFC3339, task.RunTimestamp)
	if err != nil {
		log.Printf("Failed to parse RunTimestamp for task ID %d: %v", task.ID, err)

		return
	}

	delay := time.Until(runTime)

	if delay <= 0 {
		log.Printf("RunTimestamp for task ID %d is in the past. Executing immediately.", task.ID)
		go executeTask(task)

		return
	}

	log.Printf("Scheduling task ID %d to run at %s", task.ID, runTime.Format(time.RFC1123))

	time.AfterFunc(delay, func() {
		executeTask(task)
	})
}

// TODO: Decide how to handle failures/retries
func executeTask(task ScheduledTask) {
	log.Printf("Executing task ID: %d to %s", task.ID, task.EndpointURL)

	req, err := http.NewRequest(http.MethodPost, task.EndpointURL, bytes.NewBuffer([]byte(task.Body)))
	if err != nil {
		log.Printf("Error creating request for task ID %d: %v", task.ID, err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error executing request for task ID %d: %v", task.ID, err)
		return
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Task ID %d executed successfully. Status: %d", task.ID, resp.StatusCode)
	} else {
		log.Printf("Task ID %d executed with non-success status: %d", task.ID, resp.StatusCode)
	}

	setTaskExecuted(task.ID)
}

// TODO: Decide how to handle failures/retries
func setTaskExecuted(taskID uint) {
	_, err := gorm.G[ScheduledTask](db).Where("id = ?", taskID).Update(ctx, "has_executed", true)
	if err != nil {
		log.Printf("Failed to update database for task ID %d: %v", taskID, err)
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
	http.HandleFunc("/schedule", handlePost)

	host, user, password, name, port := os.Getenv("POSTGRES_HOST"), os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD"), os.Getenv("POSTGRES_DB"), os.Getenv("POSTGRES_PORT")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC", host, user, password, name, port)
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	ctx = context.Background()

	err = db.AutoMigrate(&ScheduledTask{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	_, err = gorm.G[ScheduledTask](db).Where("1 = 1").Delete(ctx)
	if err != nil {
		log.Println("Error clearing scheduled tasks:", err)
	}

	scheduledTasks, err := gorm.G[ScheduledTask](db).Where("has_executed = ?", false).Find(ctx)
	if err != nil {
		log.Println("Error fetching scheduled tasks:", err)
	}
	// log.Printf("Pending scheduled tasks: %v", scheduledTasks)

	for _, task := range scheduledTasks {
		go scheduleTaskExecution(task)
	}

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
