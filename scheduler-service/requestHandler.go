package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"gorm.io/gorm"
)

type ScheduleTaskRequestData struct {
	RunTimestamp string `json:"runTimestamp"`
	EndpointURL  string `json:"endpointURL"`
	Body         string `json:"body"`
	Password     string `json:"password"`
	Subject      string `json:"subject,omitempty"`
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		rateLimitMiddleware(http.HandlerFunc(handlePost)).ServeHTTP(w, r)

	case http.MethodGet:
		rateLimitMiddleware(AuthMiddleware(http.HandlerFunc(handleGet))).ServeHTTP(w, r)

	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func handlePost(w http.ResponseWriter, r *http.Request) {
	var data ScheduleTaskRequestData

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)

		return
	}

	if data.Password != os.Getenv("PASSWORD") {
		log.Printf("Unauthorised access attempt from %s with password: %s", r.RemoteAddr, data.Password)

		return
	}

	newTask := ScheduledTask{
		RunTimestamp: data.RunTimestamp,
		EndpointURL:  data.EndpointURL,
		Body:         data.Body,
		HasExecuted:  false,
		CreatedBy:    &data.Subject,
	}

	if err := gorm.G[ScheduledTask](db).Create(r.Context(), &newTask); err != nil {
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

	scheduleTaskExecution(context.Background(), newTask)

	w.WriteHeader(http.StatusCreated)
}

func handleGet(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	password := query.Get("password")
	subject := query.Get("subject")

	if password == "" || subject == "" {
		http.Error(w, "Missing query parameters", http.StatusBadRequest)

		return
	}

	if password != os.Getenv("PASSWORD") {
		log.Printf("Unauthorised access attempt from %s with password: %s", r.RemoteAddr, password)

		return
	}

	tasks, err := gorm.G[ScheduledTask](db).Where("created_by = ?", subject).Find(r.Context())
	if err != nil {
		http.Error(w, "Failed to read from database", http.StatusInternalServerError)

		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}
