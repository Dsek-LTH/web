package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"gorm.io/gorm"
)

type PostScheduledTaskRequestData struct {
	RunTimestamp string `json:"runTimestamp"`
	EndpointURL  string `json:"endpointURL"`
	Body         string `json:"body"`
}

type PatchScheduledTaskRequestData struct {
	ScheduledTaskID uint   `json:"scheduledTaskID"`
	RunTimestamp    string `json:"runTimestamp,omitempty"`
	Body            string `json:"body,omitempty"`
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		rateLimitMiddleware(
			passwordMiddleware(authMiddleware(http.HandlerFunc(handlePost))),
		).ServeHTTP(w, r)

	case http.MethodGet:
		rateLimitMiddleware(
			passwordMiddleware(authMiddleware(http.HandlerFunc(handleGet))),
		).ServeHTTP(w, r)

	case http.MethodPatch:
		rateLimitMiddleware(
			passwordMiddleware(authMiddleware(http.HandlerFunc(handlePatch))),
		).ServeHTTP(w, r)

	case http.MethodDelete:
		rateLimitMiddleware(
			passwordMiddleware(authMiddleware(http.HandlerFunc(handleDelete))),
		).ServeHTTP(w, r)

	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func handlePost(w http.ResponseWriter, r *http.Request) {
	var data PostScheduledTaskRequestData

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)

		return
	}

	subject, ok := getJwtSubjectFromContext(r.Context())
	if !ok {
		http.Error(w, "Forbidden", http.StatusForbidden)

		return
	}

	newTask := ScheduledTask{
		RunTimestamp: data.RunTimestamp,
		EndpointURL:  data.EndpointURL,
		Body:         data.Body,
		HasExecuted:  false,
		CreatedBy:    &subject,
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	response := CreateScheduledTaskResponse{
		ScheduledTaskID: newTask.ID,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func handleGet(w http.ResponseWriter, r *http.Request) {
	subject, ok := getJwtSubjectFromContext(r.Context())
	if !ok {
		http.Error(w, "Forbidden", http.StatusForbidden)

		return
	}

	tasks, err := gorm.G[ScheduledTask](db).
		Where("created_by = ? AND has_executed = ?", subject, false).
		Find(r.Context())
	if err != nil {
		http.Error(w, "Failed to read from database", http.StatusInternalServerError)

		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func getJwtSubjectFromContext(ctx context.Context) (string, bool) {
	subject, ok := ctx.Value(jwtSubjectCtxKey).(string)

	return subject, ok
}

func handlePatch(w http.ResponseWriter, r *http.Request) {
	var data PatchScheduledTaskRequestData
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // Limit to 1MB
	if r.Body == nil {
		http.Error(w, "Missing request body", http.StatusBadRequest)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)

		return
	}

	subject, ok := getJwtSubjectFromContext(r.Context())
	if !ok {
		http.Error(w, "Forbidden", http.StatusForbidden)

		return
	}

	rowsAffected, err := gorm.G[ScheduledTask](db).
		Where("id = ? AND created_by = ? AND has_executed = ?", data.ScheduledTaskID, subject, false).
		Updates(r.Context(), ScheduledTask{RunTimestamp: data.RunTimestamp, Body: data.Body})
	if err != nil {
		http.Error(w, "Failed to update task", http.StatusInternalServerError)

		return
	}
	if rowsAffected == 0 {
		http.Error(w, "Task not found or already executed", http.StatusNotFound)

		return
	}

	rescheduleTaskExecution(context.Background(), data.ScheduledTaskID)

	w.WriteHeader(http.StatusNoContent)
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	subject, ok := getJwtSubjectFromContext(r.Context())
	if !ok {
		http.Error(w, "Forbidden", http.StatusForbidden)

		return
	}

	taskID := r.URL.Query().Get("scheduledTaskID")

	rowsAffected, err := gorm.G[ScheduledTask](db).
		Where("id = ? AND created_by = ? AND has_executed = ?", taskID, subject, false).
		Delete(r.Context())
	if err != nil {
		http.Error(w, "Failed to delete task", http.StatusInternalServerError)

		return
	}
	if rowsAffected == 0 {
		http.Error(w, "Task not found or already executed", http.StatusNotFound)

		return
	}

	w.WriteHeader(http.StatusNoContent)
}
