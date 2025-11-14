package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"gorm.io/gorm"
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

	err = gorm.G[ScheduledTask](db).Create(r.Context(), &newTask)
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

	scheduleTaskExecution(context.Background(), newTask)

	w.WriteHeader(http.StatusCreated)
}
